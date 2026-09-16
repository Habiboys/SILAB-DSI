import { Trash2 } from 'lucide-react';

const QuestionTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'radio', label: 'Multiple Choice (Radio)' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Number' },
];

export default function QuestionBuilder({ question, index, onChange, onRemove }) {
    const handleTypeChange = (e) => {
        onChange(index, { ...question, type: e.target.value });
    };

    const handleTextChange = (e) => {
        onChange(index, { ...question, text: e.target.value });
    };

    const handleRequiredChange = (e) => {
        onChange(index, { ...question, required: e.target.checked });
    };

    // Option handling for radio/checkbox
    const addOption = () => {
        const currentOptions = question.options || [];
        onChange(index, { 
            ...question, 
            options: [...currentOptions, { label: `Option ${currentOptions.length + 1}`, value: `opt_${Date.now()}` }] 
        });
    };

    const removeOption = (optIndex) => {
        const currentOptions = [...(question.options || [])];
        currentOptions.splice(optIndex, 1);
        onChange(index, { ...question, options: currentOptions });
    };

    const handleOptionChange = (optIndex, val) => {
        const currentOptions = [...(question.options || [])];
        currentOptions[optIndex].label = val;
        // value logic could be more complex, but keeping it simple for now
        onChange(index, { ...question, options: currentOptions });
    };

    return (
        <div className="bg-base-200 p-4 rounded-md border border-base-300 mb-4 relative group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-base-content mb-1">Question Text</label>
                    <input
                        type="text"
                        value={question.text}
                        onChange={handleTextChange}
                        className="w-full rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Enter your question here"
                        required
                    />
                </div>
                <div className="w-1/4">
                    <label className="block text-sm font-medium text-base-content mb-1">Type</label>
                    <select
                        value={question.type}
                        onChange={handleTypeChange}
                        className="w-full rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                        {QuestionTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="ml-2 mt-6 text-error hover:text-error"
                    title="Remove Question"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={question.required || false}
                    onChange={handleRequiredChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-base-300 rounded"
                />
                <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-base-content">
                    Required
                </label>
            </div>

            {/* Options for Choice based questions */}
            {(question.type === 'radio' || question.type === 'checkbox') && (
                <div className="mt-2 pl-4 border-l-2 border-primary/30">
                    <label className="block text-sm font-medium text-base-content mb-2">Options</label>
                    {question.options && question.options.map((opt, optIndex) => (
                        <div key={opt.value || optIndex} className="flex items-center mb-2">
                            <input
                                disabled
                                type={question.type === 'radio' ? 'radio' : 'checkbox'}
                                className="h-4 w-4 text-base-content/40 border-base-300 rounded"
                            />
                            <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                                className="ml-2 flex-1 rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-8"
                                placeholder={`Option ${optIndex + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeOption(optIndex)}
                                className="ml-2 text-base-content/50 hover:text-error"
                            >
                                <span className="text-lg">&times;</span>
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-primary hover:text-primary font-medium"
                    >
                        + Add Option
                    </button>
                </div>
            )}
        </div>
    );
}
