import { useState } from 'react'
import { FormField } from './UI'

const defaultForm = { title: '', description: '', target: '', weightage: '' }

export default function GoalForm({ initial = {}, onSubmit, loading, submitLabel = 'Create Goal', remainingWeight = 100 }) {
  const [form, setForm] = useState({ ...defaultForm, ...initial })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.target || isNaN(Number(form.target))) e.target = 'Valid target number required'
    const w = Number(form.weightage)
    if (!form.weightage || isNaN(w)) e.weightage = 'Weightage is required'
    else if (w < 10) e.weightage = 'Minimum weightage is 10%'
    else if (w > 100) e.weightage = 'Maximum weightage is 100%'
    else if (w > remainingWeight) e.weightage = `Only ${remainingWeight}% remaining`
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    onSubmit({ ...form, target: Number(form.target), weightage: Number(form.weightage) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Goal Title *" error={errors.title}>
        <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Improve customer satisfaction score" />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe the goal in detail…"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Target Value *" error={errors.target}>
          <input className="input" type="number" value={form.target} onChange={set('target')} placeholder="e.g. 95" />
        </FormField>

        <FormField label={`Weightage % * (${remainingWeight}% left)`} error={errors.weightage}>
          <input className="input" type="number" min="10" max="100" value={form.weightage} onChange={set('weightage')} placeholder="Min 10" />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
