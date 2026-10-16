"""Check the generated artifact's navigation, numbering, references and sections."""
import argparse
import json
import re
from pathlib import Path
from zipfile import ZipFile
from lxml import etree

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'


def validate(path, updated=False, report=None):
    with ZipFile(path) as z:
        xml = etree.fromstring(z.read('word/document.xml'))
        styles = etree.fromstring(z.read('word/styles.xml'))
        numbering = etree.fromstring(z.read('word/numbering.xml'))
        sections = xml.findall('.//' + W + 'sectPr')
        assert len(sections) == 3, 'Expected cover, front matter, body sections'
        assert sections[1].find(W + 'pgNumType').get(W + 'fmt') == 'lowerRoman'
        assert sections[2].find(W + 'pgNumType').get(W + 'start') == '1'
        assert sections[2].find(W + 'pgNumType').get(W + 'fmt', 'decimal') == 'decimal'
        for section in sections[1:]:
            margins = section.find(W + 'pgMar')
            assert all(abs(int(margins.get(W + key)) - 1417) <= 1 for key in ['top','bottom','left','right']), 'Margins must be 2.5 cm'
        for name in z.namelist():
            if re.match(r'word/header\d+\.xml$', name):
                header = etree.fromstring(z.read(name))
                assert not ''.join(header.itertext()).strip(), 'Header is not empty'
            if re.match(r'word/footer\d+\.xml$', name):
                footer = etree.fromstring(z.read(name))
                instructions = ' '.join(footer.xpath('//w:instrText/text()', namespaces=NS))
                if 'PAGE' in instructions:
                    p = footer.find('w:p', NS)
                    assert p.find('w:pPr/w:jc', NS).get(W+'val') == 'center', 'Page number must be centered'
                    content = ''.join(footer.xpath('//w:t/text()', namespaces=NS)).strip()
                    assert re.fullmatch(r'[0-9ivxlcdm]+', content), 'Footer must contain only page number'
        expected = {'Heading1': ('24', True), 'Heading2': ('24', True), 'Heading3': ('24', True), 'FrontMatterTitle': ('24', True), 'Normal': ('24', False)}
        for sid, (size, bold) in expected.items():
            style = styles.find(f'w:style[@w:styleId="{sid}"]', NS)
            rp = style.find('w:rPr', NS)
            def inherited(prop, attribute):
                current=style
                while current is not None:
                    node=current.find('w:rPr/w:'+prop,NS)
                    if node is not None and node.get(W+attribute) is not None: return node.get(W+attribute)
                    parent=current.find('w:basedOn',NS)
                    current=styles.find(f'w:style[@w:styleId="{parent.get(W+"val")}"]',NS) if parent is not None else None
                defaults=styles.find('w:docDefaults/w:rPrDefault/w:rPr/w:'+prop,NS)
                return defaults.get(W+attribute) if defaults is not None else None
            assert inherited('rFonts','ascii') == 'Times New Roman', sid
            assert inherited('sz','val') == size, sid
            b = rp.find('w:b', NS)
            assert (b is not None and b.get(W+'val') != '0') == bold, sid
        normal=styles.find('w:style[@w:styleId="Normal"]',NS)
        assert normal.find('w:pPr/w:jc',NS).get(W+'val')=='both', 'Body must be justified'
        assert normal.find('w:pPr/w:spacing',NS).get(W+'line')=='360', 'Body must use 1.5 spacing'
        for sid in ['Heading1','Caption','FrontMatterTitle']:
            assert styles.find(f'w:style[@w:styleId="{sid}"]/w:pPr/w:jc',NS).get(W+'val')=='center', sid+' must be centered'
        for sid in ['Heading1','Heading2','Heading3']:
            caps=styles.find(f'w:style[@w:styleId="{sid}"]/w:rPr/w:caps',NS)
            assert caps is None or caps.get(W+'val','1') in ['0','false'], sid+' must not force uppercase'
        caps=styles.find('w:style[@w:styleId="FrontMatterTitle"]/w:rPr/w:caps',NS)
        assert caps is not None and caps.get(W+'val','1') not in ['0','false'], 'Front matter titles must be uppercase'
        paragraphs = xml.findall('.//' + W + 'p')
        levels = []
        for p in paragraphs:
            st = p.find('w:pPr/w:pStyle', NS)
            if st is not None and st.get(W+'val') in ['Heading1','Heading2','Heading3']:
                levels.append(int(st.get(W+'val')[-1]))
                if st.get(W+'val') == 'Heading1':
                    assert p.find('w:r/w:br', NS) is not None, 'Chapter title must start below its number'
                    title = ''.join(p.xpath('.//w:t/text()', namespaces=NS))
                    assert title == title.upper(), 'Chapter name must be uppercase'
        narrative = [p for p in paragraphs if p.find('w:pPr/w:ind', NS) is not None and p.find('w:pPr/w:pStyle', NS) is None]
        assert len(narrative) > 20, 'Missing narrative first-line indents'
        assert all(abs(int(p.find('w:pPr/w:ind', NS).get(W+'firstLine', '0')) - 709) <= 1 for p in narrative), 'Narrative indent must be 1.25 cm'
        assert levels and levels[0] == 1
        assert all(b <= a + 1 for a,b in zip(levels,levels[1:])), 'Skipped heading level'
        instr = ' '.join((''.join(xml.xpath('//w:instrText/text()', namespaces=NS)) + ' ' + ' '.join(xml.xpath('//w:fldSimple/@w:instr', namespaces=NS))).split())
        for required in ['TOC', 'SEQ Gambar', 'STYLEREF', 'REF gbfig_']:
            assert required in instr, 'Missing field: ' + required
        assert '\\c "Gambar"' in instr and '\\o "1-3"' in instr
        assert len(xml.findall('.//' + W + 'drawing')) >= 3, 'No embedded screenshots'
        names = xml.xpath('//w:bookmarkStart/@w:name', namespaces=NS)
        assert len(names) == len(set(names)), 'Duplicate bookmarks'
        for ref in re.findall(r'\bREF (gbfig_\w+)', instr): assert ref in names, 'Broken REF ' + ref
        for sid in ['Heading1','Heading2','Heading3']:
            style = styles.find(f'w:style[@w:styleId="{sid}"]', NS)
            np = style.find('w:pPr/w:numPr', NS)
            assert np is not None, 'Heading not linked to numbering'
        step_ids = set()
        for p in paragraphs:
            st = p.find('w:pPr/w:pStyle', NS)
            if st is not None and st.get(W+'val') == 'NumberedList':
                assert not re.match(r'^\d+\.', ''.join(p.xpath('.//w:t/text()', namespaces=NS))), 'Manual step number'
                step_ids.add(p.find('w:pPr/w:numPr/w:numId', NS).get(W+'val'))
        assert len(step_ids) >= 8, 'Tasks do not have independent step lists'
        for nid in step_ids:
            num = numbering.find(f'w:num[@w:numId="{nid}"]', NS)
            assert num.find('w:lvlOverride/w:startOverride', NS).get(W+'val') == '1', 'Step list does not restart'
        text = ' '.join(xml.xpath('//w:t/text()', namespaces=NS))
        assert not re.search(r'FACE_SERVICE_TOKEN|DB_PASSWORD\s*=|[a-f0-9]{64}', text), 'Possible credential in output'
        assert not re.search(r'Error!|Kesalahan!|Reference source not found|Bookmark not defined', text, re.I), 'Word field error'
        if updated:
            assert 'akan diperbarui oleh Microsoft Word' not in text, 'TOC not updated'
            assert xml.xpath('//w:hyperlink', namespaces=NS), 'No navigation hyperlinks'
            assert re.search(r'Gambar\s+2\.1', text), 'Chapter figure numbering not resolved'
            report_path=report or path.parent/'qa/word-report.json'
            data=json.loads(report_path.read_text(encoding='utf-8-sig'))
            assert data['tables_of_contents']==1 and data['tables_of_figures']>=1
            for heading in data['headings']:
                patterns={1:r'BAB \d+',2:r'\d+\.\d+',3:r'\d+\.\d+\.\d+'}
                assert re.fullmatch(patterns[heading['level']], heading['number']), 'Unnumbered outline: '+heading['text']
        print(f'PASS: {len(levels)} headings, {len(step_ids)} task lists, {len(names)} bookmarks; updated={updated}')


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('path',type=Path); parser.add_argument('--require-updated',action='store_true');parser.add_argument('--report',type=Path)
    args=parser.parse_args(); validate(args.path,args.require_updated,args.report)
