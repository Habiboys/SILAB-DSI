<?php

namespace App\Exports;

use App\Models\Survey;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SurveyExport implements FromCollection, WithHeadings, WithMapping
{
    protected $survey;

    public function __construct(Survey $survey)
    {
        $this->survey = $survey;
    }

    public function collection()
    {
        return $this->survey->responses()->with(['user', 'answers.question'])->get();
    }

    public function headings(): array
    {
        $headers = [
            'Response ID',
            'User Name',
            'User Email',
            'Submitted At',
        ];

        foreach ($this->survey->questions as $question) {
            $headers[] = $question->question_text;
        }

        return $headers;
    }

    public function map($response): array
    {
        $row = [
            $response->id,
            $response->user ? $response->user->name : 'Anonymous',
            $response->user ? $response->user->email : '-',
            $response->submitted_at->format('Y-m-d H:i:s'),
        ];

        // Map answers to questions in order
        foreach ($this->survey->questions as $question) {
            $answer = $response->answers->where('question_id', $question->id)->first();
            $row[] = $answer ? $answer->answer_text : '';
        }

        return $row;
    }
}
