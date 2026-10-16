"""Reusable Word components for the SILAB guidebook."""
from pathlib import Path
import re

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


def element(tag, **attrs):
    node = OxmlElement(tag)
    for key, value in attrs.items():
        node.set(qn('w:' + key), str(value))
    return node


def field(paragraph, instruction, cached=''):
    for kind, value in [('begin', None), ('instr', instruction), ('separate', None), ('text', cached), ('end', None)]:
        run = OxmlElement('w:r')
        if kind == 'instr':
            node = OxmlElement('w:instrText'); node.set(qn('xml:space'), 'preserve'); node.text = ' ' + value + ' '
        elif kind == 'text':
            node = OxmlElement('w:t'); node.text = value
        else:
            node = element('w:fldChar', fldCharType=kind)
            if kind == 'begin': node.set(qn('w:dirty'), 'true')
        run.append(node); paragraph._p.append(run)


def rich(paragraph, text):
    for index, part in enumerate(re.split(r'\*\*(.*?)\*\*', text)):
        if part:
            run = paragraph.add_run(part)
            if index % 2: run.bold = True


class Guidebook:
    def __init__(self, assets_root):
        self.root = Path(assets_root)
        self.doc = Document()
        self.chapter_number = 0
        self.figure_number = 0
        self.table_number = 0
        self.module_titles = []
        self.bookmark_id = 1
        self.figure_bookmarks = {}
        self.used_ids = set()
        self._styles()
        self._numbering()
        for section in self.doc.sections:
            self._page(section)
        self.doc.settings.odd_and_even_pages_header_footer = False
        self.doc.settings.element.append(element('w:updateFields', val='false'))
        self.doc.core_properties.title = 'Panduan penggunaan SILAB per modul dan per peran'
        self.doc.core_properties.subject = 'Contoh standar buku panduan per modul dan per peran'
        self.doc.core_properties.author = 'SILAB'

    def _styles(self):
        styles = self.doc.styles
        for name in ['Front Matter Title', 'Procedure Label', 'Numbered List', 'Bulleted List']:
            if name not in styles: styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        for style in styles:
            if style.type not in [WD_STYLE_TYPE.PARAGRAPH, WD_STYLE_TYPE.CHARACTER]: continue
            style.font.name = 'Times New Roman'
            style.font.color.rgb = RGBColor(0, 0, 0)
            fonts = style.element.get_or_add_rPr().find(qn('w:rFonts'))
            if fonts is not None:
                for attr in list(fonts.attrib):
                    if 'theme' in attr.lower(): del fonts.attrib[attr]
                fonts.set(qn('w:eastAsia'), 'Times New Roman')
                fonts.set(qn('w:cs'), 'Times New Roman')
            for border in style.element.findall('.//' + qn('w:pBdr')): border.getparent().remove(border)
        normal = styles['Normal']
        normal.font.size = Pt(12); normal.font.bold = False
        normal.paragraph_format.line_spacing = 1.5
        normal.paragraph_format.space_after = Pt(6)
        normal.paragraph_format.widow_control = True
        normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        settings = [('Heading 1', 12, True), ('Heading 2', 12, True), ('Heading 3', 12, True),
                    ('Procedure Label', 12, True), ('Front Matter Title', 12, True),
                    ('Title', 26, True), ('Subtitle', 14, False), ('Caption', 10, False),
                    ('Footer', 10, False), ('Numbered List', 12, False), ('Bulleted List', 12, False)]
        for name, size, bold in settings:
            style = styles[name]; style.base_style = normal
            style.font.size = Pt(size); style.font.bold = bold
            style.font.italic = False
            style.paragraph_format.line_spacing = 1.5
            if name.startswith('Heading') or name in ['Procedure Label', 'Front Matter Title', 'Footer']:
                style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            if name.startswith('Heading') or name in ['Procedure Label', 'Front Matter Title']:
                style.paragraph_format.keep_with_next = True
                style.paragraph_format.keep_together = True
                style.paragraph_format.space_before = Pt(12 if name != 'Procedure Label' else 6)
                style.paragraph_format.space_after = Pt(6)
            if name == 'Caption': style.paragraph_format.space_after = Pt(8)
        styles['Heading 1'].paragraph_format.page_break_before = True
        styles['Heading 1'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        styles['Front Matter Title'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for name in ['Heading 1', 'Heading 2', 'Heading 3', 'Front Matter Title']:
            styles[name].font.all_caps = False
        styles['Front Matter Title'].font.all_caps = True
        styles['Caption'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        styles['Caption'].paragraph_format.line_spacing = 1
        styles['Footer'].paragraph_format.line_spacing = 1
        for name in ['Front Matter Title', 'Procedure Label', 'Title', 'Caption']:
            styles[name].element.get_or_add_pPr().append(element('w:outlineLvl', val=9))
        for i in range(1, 4):
            name = 'TOC ' + str(i)
            if name not in styles: styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
            styles[name].base_style = normal
            styles[name].font.name = 'Times New Roman'
            styles[name].font.size = Pt(12)
            styles[name].font.bold = False
            styles[name].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            styles[name].paragraph_format.line_spacing = 1.15
        name = 'Table of Figures'
        if name not in styles: styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        styles[name].base_style = normal
        styles[name].font.name = 'Times New Roman'
        styles[name].font.size = Pt(12)
        styles[name].font.bold = False
        styles[name].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        styles[name].paragraph_format.line_spacing = 1.15
        styles[name].paragraph_format.space_after = Pt(3)
        if 'Hyperlink' in styles:
            styles['Hyperlink'].font.color.rgb = RGBColor(0, 0, 0)
            styles['Hyperlink'].font.underline = False

    def _next_id(self, tag, attr):
        values = [int(n.get(qn('w:' + attr))) for n in self.doc.part.numbering_part.element.findall(qn('w:' + tag))]
        return max(values, default=0) + 1

    def _abstract(self, formats):
        num = self.doc.part.numbering_part.element
        aid = self._next_id('abstractNum', 'abstractNumId')
        abstract = element('w:abstractNum', abstractNumId=aid)
        abstract.append(element('w:nsid', val=f'{0x53490000 + aid:08X}'))
        abstract.append(element('w:multiLevelType', val='multilevel' if len(formats) > 1 else 'singleLevel'))
        for level, (fmt, text, style) in enumerate(formats):
            lvl = element('w:lvl', ilvl=level)
            lvl.append(element('w:start', val=1)); lvl.append(element('w:numFmt', val=fmt))
            if level: lvl.append(element('w:lvlRestart', val=level))
            if style: lvl.append(element('w:pStyle', val=style))
            lvl.append(element('w:suff', val='space')); lvl.append(element('w:lvlText', val=text))
            lvl.append(element('w:lvlJc', val='left'))
            pp = element('w:pPr')
            pp.append(element('w:ind', left=0 if style else 360, hanging=0 if style else 360))
            lvl.append(pp)
            rp = element('w:rPr'); rp.append(element('w:rFonts', ascii='Times New Roman', hAnsi='Times New Roman'))
            lvl.append(rp); abstract.append(lvl)
        # abstractNum must precede num instances in OOXML.
        first_num = num.find(qn('w:num'))
        if first_num is None: num.append(abstract)
        else: first_num.addprevious(abstract)
        return aid

    def _instance(self, aid, restart=False):
        nid = self._next_id('num', 'numId')
        num = element('w:num', numId=nid); num.append(element('w:abstractNumId', val=aid))
        if restart:
            override = element('w:lvlOverride', ilvl=0); override.append(element('w:startOverride', val=1)); num.append(override)
        self.doc.part.numbering_part.element.append(num)
        return nid

    @staticmethod
    def _numpr(pp, nid, level=0):
        old = pp.find(qn('w:numPr'))
        if old is not None: pp.remove(old)
        np = element('w:numPr'); np.append(element('w:ilvl', val=level)); np.append(element('w:numId', val=nid)); pp.append(np)

    def _numbering(self):
        aid = self._abstract([('decimal', 'BAB %1', 'Heading1'), ('decimal', '%1.%2', 'Heading2'), ('decimal', '%1.%2.%3', 'Heading3')])
        self.heading_num = self._instance(aid)
        for i in range(3): self._numpr(self.doc.styles['Heading ' + str(i + 1)].element.get_or_add_pPr(), self.heading_num, i)
        self.list_abstract = self._abstract([('decimal', '%1.', None)])
        self.bullet_num = self._instance(self._abstract([('bullet', '\u2022', None)]))

    @staticmethod
    def _page(section):
        section.page_width = Cm(21); section.page_height = Cm(29.7)
        section.top_margin = section.bottom_margin = section.left_margin = section.right_margin = Cm(2.5)
        section.header_distance = section.footer_distance = Cm(1.2)
        section.different_first_page_header_footer = False

    def _section(self, format, footer=True):
        section = self.doc.add_section(WD_SECTION_START.NEW_PAGE)
        self._page(section)
        section.header.is_linked_to_previous = False
        section.footer.is_linked_to_previous = False
        for kind in [section.header, section.first_page_header, section.even_page_header]:
            kind.is_linked_to_previous = False
            for p in kind.paragraphs: p.clear()
        for kind in [section.footer, section.first_page_footer, section.even_page_footer]:
            kind.is_linked_to_previous = False
            for p in kind.paragraphs: p.clear()
        for old in section._sectPr.findall(qn('w:pgNumType')): section._sectPr.remove(old)
        section._sectPr.append(element('w:pgNumType', fmt=format, start=1))
        if footer:
            p = section.footer.paragraphs[0]; p.style = self.doc.styles['Footer']
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            field(p, 'PAGE', '1')
        return section

    def paragraph(self, text='', style=None):
        if style == 'Front Matter Title': text = text.upper()
        p = self.doc.add_paragraph(style=style)
        if style is None and text: p.paragraph_format.first_line_indent = Cm(1.25)
        rich(p, text)
        return p

    @staticmethod
    def title_case(text):
        minor = {'dan', 'atau', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'yang', 'sebagai', 'sebelum', 'setelah'}
        return ' '.join(word if word.isupper() else word.lower() if i and word.lower() in minor else word[:1].upper() + word[1:] for i, word in enumerate(text.split()))

    def label(self, text): return self.paragraph(text, 'Procedure Label')

    def chapter(self, title):
        self.chapter_number += 1; self.figure_number = 0; self.table_number = 0
        return self.heading(title, 1)

    def heading(self, title, level):
        p = self.doc.add_paragraph(style='Heading ' + str(level))
        if level == 1:
            p.add_run().add_break()
            p.add_run(title.upper())
        else:
            p.add_run(self.title_case(title))
        self._numpr(p._p.get_or_add_pPr(), self.heading_num, level - 1)
        return p

    def subchapter(self, title): return self.heading(title, 2)

    def bullets(self, items):
        for text in items:
            p = self.paragraph(text, 'Bulleted List'); self._numpr(p._p.get_or_add_pPr(), self.bullet_num)
            p.paragraph_format.left_indent = Cm(.64); p.paragraph_format.first_line_indent = Cm(-.64)

    def steps(self, items, after_step=None):
        nid = self._instance(self.list_abstract, restart=True)
        for index, text in enumerate(items, 1):
            p = self.paragraph(text, 'Numbered List'); self._numpr(p._p.get_or_add_pPr(), nid)
            p.paragraph_format.left_indent = Cm(.64); p.paragraph_format.first_line_indent = Cm(-.64)
            if after_step: after_step(index)

    def _bookmark(self, paragraph, name, writer):
        bid = self.bookmark_id; self.bookmark_id += 1
        paragraph._p.append(element('w:bookmarkStart', id=bid, name=name))
        writer(); paragraph._p.append(element('w:bookmarkEnd', id=bid))

    def figure_reference(self, figid):
        if figid not in self.figure_bookmarks: raise ValueError('Figure reference before definition: ' + figid)
        name, number = self.figure_bookmarks[figid]
        p = self.paragraph('Lihat ')
        field(p, 'REF ' + name + ' \\h', 'Gambar ' + number)
        p.add_run(' untuk bagian yang dijelaskan pada langkah ini.')
        p.paragraph_format.keep_with_next = True

    def figure(self, info):
        figid = info['id']
        if figid in self.used_ids: raise ValueError('Duplicate figure ID: ' + figid)
        self.used_ids.add(figid)
        self.figure_number += 1
        number = f'{self.chapter_number}.{self.figure_number}'
        name = 'gbfig_' + re.sub('[^a-zA-Z0-9_]', '_', figid)[:30]
        self.figure_bookmarks[figid] = (name, number)
        # Establish the bookmark mapping before placing the nearby REF field.
        self.figure_reference(figid)
        path = self.root / info['path']
        p = self.paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.keep_with_next = True
        from PIL import Image
        with Image.open(path) as img: ratio = img.height / img.width
        width = min(16, 10.5 / ratio)
        p.add_run().add_picture(str(path), width=Cm(width))
        p = self.doc.add_paragraph(style='Caption')
        def write_number():
            p.add_run('Gambar ')
            field(p, 'STYLEREF "Heading 1" \\s', str(self.chapter_number))
            p.add_run('.')
            field(p, 'SEQ Gambar \\* ARABIC \\s 1', str(self.figure_number))
        self._bookmark(p, name, write_number)
        p.add_run(' ' + info['caption'])

    def table(self, headers, rows, widths, caption='Ringkasan informasi'):
        self.table_number += 1
        p = self.doc.add_paragraph(style='Caption')
        p.paragraph_format.keep_with_next = True
        p.add_run('Tabel ')
        field(p, 'STYLEREF "Heading 1" \\s', str(self.chapter_number))
        p.add_run('.')
        field(p, 'SEQ Tabel \\* ARABIC \\s 1', str(self.table_number))
        p.add_run(' ' + caption)
        t = self.doc.add_table(rows=1, cols=len(headers)); t.autofit = False
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for col, width in zip(t.columns, widths): col.width = Cm(width)
        for c, value in zip(t.rows[0].cells, headers): c.text = value
        t.rows[0]._tr.get_or_add_trPr().append(element('w:tblHeader'))
        for values in rows:
            for cell, value in zip(t.add_row().cells, values): cell.text = value
        for index, row in enumerate(t.rows):
            row._tr.get_or_add_trPr().append(element('w:cantSplit'))
            for c, width in zip(row.cells, widths):
                c.width = Cm(width)
                props = c._tc.get_or_add_tcPr()
                props.append(element('w:vAlign', val='center'))
                borders = element('w:tcBorders')
                for edge in ['top', 'left', 'bottom', 'right']: borders.append(element('w:' + edge, val='single', sz=4, color='D9D9D9'))
                props.append(borders)
                margins = element('w:tcMar')
                for edge in ['top', 'left', 'bottom', 'right']: margins.append(element('w:' + edge, w=90, type='dxa'))
                props.append(margins)
                if index == 0: props.append(element('w:shd', fill='E8EDF2'))
                for p in c.paragraphs:
                    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    p.paragraph_format.line_spacing = 1.15
                    p.paragraph_format.space_after = Pt(3)
                    for r in p.runs: r.bold = index == 0
        # Avoid an empty trailing paragraph overflowing onto a blank page before a chapter.

    def cover(self):
        section = self.doc.sections[0]
        section.top_margin = Cm(1.2); section.bottom_margin = Cm(1)
        section.left_margin = section.right_margin = Cm(1.5)
        section.footer.paragraphs[0].clear()
        p = self.paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(self.root / 'public/images/silab2.png'), width=Cm(3))
        p = self.paragraph('Panduan penggunaan SILAB', 'Title'); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p = self.paragraph('Buku panduan per modul dan per peran\n' + self.module_names, 'Subtitle'); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p = self.paragraph('Untuk petugas, pengelola, dan peninjau yang berwenang\nVersi standar 1.0  |  15 Oktober 2026'); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(18)
        p = self.paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        pic = p.add_run().add_picture(str(self.root / 'public/images/lab.png'), width=Cm(18), height=Cm(15))
        src = OxmlElement('a:srcRect'); src.set('t', '35000'); src.set('b', '18125')
        pic._inline.graphic.graphicData.pic.blipFill.insert(1, src)

    def front_matter(self, modules):
        self.module_titles = [module['title'].removeprefix('Modul ') for module in modules]
        self.module_names = ', '.join(self.module_titles[:-1]) + ' dan ' + self.module_titles[-1] if len(self.module_titles) > 1 else self.module_titles[0]
        self.doc.core_properties.title = 'Panduan penggunaan SILAB ' + ' dan '.join(self.module_titles)
        self.cover()
        self._section('lowerRoman')
        self.paragraph('Pengantar', 'Front Matter Title')
        self.paragraph('Buku ini membantu pengguna menjalankan tugas SILAB sesuai peran dan kewenangannya. Edisi ini memuat modul ' + self.module_names + '. Setiap modul dimulai dengan pengantar, alur singkat, dan prasyarat, lalu menjelaskan tugas setiap peran.')
        self.paragraph('Hak akses dapat berbeda menurut role, jabatan, laboratorium, dan kepengurusan. Gunakan prosedur yang sesuai dengan menu dan tindakan yang tersedia pada akun Anda.')
        self.paragraph('Daftar isi', 'Front Matter Title').paragraph_format.page_break_before = True
        field(self.paragraph(), 'TOC \\o "1-3" \\h \\z \\u', 'Daftar isi akan diperbarui oleh Microsoft Word.')
        self.paragraph('Daftar gambar', 'Front Matter Title').paragraph_format.page_break_before = True
        field(self.paragraph(), 'TOC \\h \\z \\c "Gambar"', 'Daftar gambar akan diperbarui oleh Microsoft Word.')
        self.paragraph('Daftar tabel', 'Front Matter Title').paragraph_format.page_break_before = True
        field(self.paragraph(), 'TOC \\h \\z \\c "Tabel"', 'Daftar tabel akan diperbarui oleh Microsoft Word.')
        self._section('decimal')

    def task(self, data, module_id):
        self.heading(data['title'], 3)
        self.paragraph(data['summary'])
        self.label('Sebelum mulai'); self.bullets(data['before'])
        self.label('Langkah')
        figures = data.get('figures', [])
        def after(index):
            for fig in figures:
                if fig['after_step'] == index:
                    self.figure({**fig, 'id': module_id + '_' + fig['id']})
        self.steps(data['steps'], after)
        self.label('Hasil berhasil'); self.paragraph(data['success'])
        if data.get('failure'): self.label('Jika gagal'); self.paragraph(data['failure'])

    def module(self, data):
        self.chapter(data['title'])
        self.subchapter('Pengantar modul')
        self.paragraph(data['introduction'])
        self.label('Alur singkat'); self.paragraph(data['flow'])
        self.label('Sebelum menggunakan modul'); self.bullets(data['prerequisites'])
        for group in data['groups']:
            self.subchapter(group['title'])
            for task in group['tasks']: self.task(task, data['id'])
        self.subchapter('Kendala pada modul ' + data['title'].removeprefix('Modul '))
        self.doc.paragraphs[-1].paragraph_format.page_break_before = True
        self.table(['Kendala', 'Tindak lanjut'], data['issues'], [5, 11], 'Kendala dan tindak lanjut ' + data['title'])

    def introduction(self):
        self.chapter('Pengenalan aplikasi')
        self.subchapter('Gambaran umum SILAB')
        self.paragraph('SILAB (Sistem Informasi Manajemen Laboratorium) adalah aplikasi berbasis web yang mengintegrasikan pengelolaan laboratorium, mulai dari kepengurusan, inventaris, keuangan, dan piket hingga praktikum serta kuesioner. SILAB membantu asisten, praktikan, dosen, dan kepala laboratorium menjalankan kegiatan, memantau data, serta menyusun laporan dalam satu sistem.')
        self.subchapter('Tujuh modul utama')
        self.paragraph('SILAB memiliki tujuh modul utama yang saling mendukung pengelolaan laboratorium. Setiap modul digunakan sesuai kebutuhan kegiatan dan kewenangan pengguna.')
        self.table(['Modul', 'Kegunaan'], [
            ['Kepengurusan', 'Mengelola periode kepengurusan, anggota, jabatan, program kerja, kegiatan, evaluasi, dan laporan laboratorium.'],
            ['Piket', 'Mengelola jadwal piket, kehadiran, check-in, checkout, dan permintaan perubahan jadwal.'],
            ['Inventaris', 'Mengelola data aset, pengadaan, peminjaman, pengembalian, dan kondisi barang laboratorium.'],
            ['Praktikum', 'Mengelola kelas, peserta, asisten, pertemuan, modul pembelajaran, absensi, tugas, nilai, sertifikat, dan laporan praktikum.'],
            ['Keuangan', 'Mencatat pemasukan, pengeluaran, pembayaran kas anggota, serta rekap keuangan.'],
            ['Kuesioner', 'Menyusun kuesioner, mengumpulkan jawaban responden, dan memeriksa hasil untuk evaluasi.'],
            ['Surat Menyurat', 'Mengelola kebutuhan surat dan dokumen administrasi laboratorium.'],
        ], [4, 12], 'Tujuh modul utama SILAB')
        self.subchapter('Enam role pengguna')
        self.paragraph('SILAB melibatkan enam role pengguna, yaitu Superadmin, Ketua Departemen, Admin, Dosen, Asisten, dan Praktikan. Role menentukan peran umum akun dalam sistem. Menu dan tindakan yang tersedia mengikuti kewenangan masing-masing pengguna.')
        self.table(['Role', 'Peran dalam sistem'], [
            ['Superadmin', 'Mengelola sistem dan pengaturan akses pengguna secara menyeluruh.'],
            ['Ketua Departemen', 'Memantau pengelolaan laboratorium serta meninjau pengajuan dan laporan yang memerlukan keputusan departemen.'],
            ['Admin', 'Mengelola administrasi dan data aplikasi sesuai kewenangan yang diberikan.'],
            ['Dosen', 'Terlibat dalam pengelolaan, pemantauan, dan peninjauan kegiatan laboratorium sesuai jabatan serta penugasannya.'],
            ['Asisten', 'Menjalankan kegiatan operasional laboratorium, kepengurusan, piket, dan pendampingan praktikum sesuai jabatan serta penugasannya.'],
            ['Praktikan', 'Mengikuti praktikum, mengakses materi dan tugas, mengumpulkan pekerjaan, serta melihat hasil yang tersedia.'],
        ], [4, 12], 'Enam role pengguna SILAB')
        self.subchapter('Pembagian jabatan Dosen dan Asisten')
        self.paragraph('Dari enam role tersebut, Dosen dan Asisten memiliki pembagian lebih lanjut berdasarkan jabatan dalam kepengurusan laboratorium. Jabatan menunjukkan tanggung jawab pengguna pada laboratorium dan periode tertentu. Karena itu, pengguna dengan role yang sama dapat memiliki tugas dan kewenangan yang berbeda.')
        self.paragraph('Pada role Dosen, pembagian jabatan mencakup Kepala Laboratorium (Kalab) dan dosen anggota kepengurusan. Kepala Laboratorium menjalankan tanggung jawab pengelolaan dan peninjauan kegiatan laboratorium, sedangkan dosen anggota terlibat sesuai tanggung jawab yang diberikan.')
        self.paragraph('Pada role Asisten, pembagian jabatan dapat mencakup Sekretaris, Bendahara, Wakil Bendahara, koordinator, dan anggota divisi sesuai struktur kepengurusan. Sebagai contoh, Bendahara menangani pencatatan keuangan, Sekretaris menangani administrasi surat, dan koordinator menjalankan tanggung jawab sesuai bidangnya.')
        self.paragraph('Role dan jabatan perlu dibedakan: Dosen dan Asisten adalah role akun, sedangkan Kepala Laboratorium, Bendahara, Sekretaris, dan koordinator merupakan jabatan. Akses tindakan mengikuti izin, jabatan, laboratorium, periode kepengurusan, serta penugasan yang berlaku.')
        self.subchapter('Masuk dan memilih kepengurusan')
        self.paragraph('Masuk menggunakan akun Anda, lalu periksa laboratorium dan tahun kepengurusan pada navigasi atas sebelum melakukan tindakan. Pilihan ini menentukan lingkup data yang ditampilkan dan dapat dikelola.')
        self.figure({'id': 'login', 'path': 'output/absensi-piket/login.png', 'caption': 'Halaman login SILAB'})

    def general_issues(self):
        self.chapter('Penanganan kendala umum')
        self.subchapter('Menangani akses dan pengiriman')
        self.bullets(['Jika sesi berakhir, masuk kembali dan periksa apakah tindakan sebelumnya sudah tersimpan.', 'Jika menu atau tombol tidak tersedia, periksa laboratorium, kepengurusan aktif, serta kewenangan akun.', 'Jika jaringan terputus, periksa status data sebelum mengirim ulang agar tidak membuat pengajuan ganda.'])
        self.subchapter('Meminta bantuan')
        self.paragraph('Jika terjadi error atau kendala saat menggunakan SILAB, hubungi nomor 085142247464 atau kirim email ke nouvalhabibie18@gmail.com. Gunakan format berikut agar masalah dapat ditelusuri.')
        self.label('Format laporan melalui nomor kontak')
        self.paragraph('Halo, saya ingin melaporkan kendala pada SILAB.')
        self.bullets(['Nama: [nama pelapor]', 'Role dan jabatan: [role serta jabatan, jika ada]', 'Laboratorium dan periode: [nama laboratorium dan periode kepengurusan]', 'Modul atau halaman: [nama modul dan halaman yang bermasalah]', 'Waktu kejadian: [tanggal dan jam]', 'Langkah sebelum error: [urutan tindakan hingga error muncul]', 'Pesan error: [salin pesan yang tampil]', 'Hasil yang diharapkan: [tindakan yang seharusnya berhasil]', 'Lampiran: [screenshot error]'])
        self.label('Format laporan melalui email')
        self.paragraph('Kepada: nouvalhabibie18@gmail.com')
        self.paragraph('Subjek: [SILAB] Laporan Error - [Nama Modul] - [Nama Pelapor]')
        self.paragraph('Isi email menggunakan format laporan di atas. Lampirkan screenshot yang memperlihatkan pesan error dan bagian halaman terkait.')
        self.paragraph('Jangan mengirim password, kode OTP, token, atau cookie sesi. Samarkan data pribadi yang tidak diperlukan pada screenshot.')

    def save(self, path):
        path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
        self.doc.save(path)
