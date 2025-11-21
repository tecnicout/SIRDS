from pathlib import Path
path = Path(r'c:\SIRDS\SIRDS\frontend\src\components\Modal\EditModal.jsx')
text = path.read_text(encoding='utf-8').replace('\r\n', '\n')

def replace_section(full_text, start_marker, end_marker, new_block):
    start = full_text.index(start_marker)
    end = full_text.index(end_marker, start) + len(end_marker)
    return full_text[:start] + new_block + full_text[end:]

footer_start = "  const footer = (\n"
footer_end = "  );\n\n  return (\n"
new_footer = "  const footer = (\n    <div className=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end\">\n      <button\n        type=\"button\"\n        onClick={onClose}\n        className=\"inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:w-auto\"\n        disabled={isSubmitting}\n      >\n        {cancelText}\n      </button>\n      <button\n        type=\"submit\"\n        form=\"edit-form\"\n        className=\"inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto\"\n        disabled={isSubmitting}\n      >\n        {isSubmitting ? 'Guardando...' : submitText}\n      </button>\n    </div>\n  );\n\n  return (\n"
text = replace_section(text, footer_start, footer_end, new_footer)

base_start = "    const baseInputClass = `"
base_end = "    }`;\n\n    // Resolver"
new_base = "    const baseInputClass = `w-full px-4 py-3 md:px-5 md:py-3.5 rounded-2xl border text-sm md:text-base transition duration-200 focus:outline-none ${\n      error\n        ? 'border-red-200 bg-red-50/80 text-red-900 focus:border-red-300 focus:ring-2 focus:ring-red-200 shadow-sm'\n        : 'border-transparent bg-white/80 shadow-sm hover:shadow-lg focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200'\n    }`;\n\n    // Resolver"
text = replace_section(text, base_start, base_end, new_base)

form_start = "  return (\n    <form id=\"edit-form\""
form_end = "  );\n};\n\n// Configuraci"
new_form = "  return (\n    <form id=\"edit-form\" onSubmit={onSubmit} className={`space-y-6 ${className}`}>\n      <div className=\"rounded-3xl border border-white/60 bg-gradient-to-b from-white/95 via-white/80 to-white/60 p-4 shadow-xl shadow-emerald-100/60 backdrop-blur\">\n        <div className=\"grid grid-cols-1 gap-5 md:grid-cols-2\">\n          {fields.map(field => (\n            <div\n              key={field.name}\n              className={`flex flex-col gap-2 ${field.fullWidth ? 'md:col-span-2' : ''}`}\n            >\n              <label\n                htmlFor={field.name}\n                className=\"block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-gray-500 md:text-xs\"\n              >\n                {field.label}\n                {field.required && <span className=\"text-red-500 ml-1\">*</span>}\n              </label>\n\n              {field.type === 'checkbox' ? (\n                <div className=\"flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 shadow-sm\">\n                  {renderField(field)}\n                  <label htmlFor={field.name} className=\"text-sm font-medium text-gray-700\">\n                    {field.checkboxLabel || field.label}\n                  </label>\n                </div>\n              ) : (\n                renderField(field)\n              )}\n\n              {errors[field.name] && (\n                <p className=\"mt-1.5 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm\">\n                  {errors[field.name]}\n                </p>\n              )}\n            </div>\n          ))}\n        </div>\n      </div>\n    </form>\n  );\n\n};\n\n// Configuraci"
text = replace_section(text, form_start, form_end, new_form)

path.write_text(text.replace('\n', '\r\n'), encoding='utf-8')
