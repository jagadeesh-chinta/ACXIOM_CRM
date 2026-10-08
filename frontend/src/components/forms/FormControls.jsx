import React from 'react';

export const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  icon,
  step,
  min
}) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <div className="position-relative">
      {icon && (
        <i
          className={`bi ${icon} position-absolute text-muted`}
          style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        ></i>
      )}
      <input
        id={id}
        name={id}
        type={type}
        className={`form-control ${icon ? 'ps-5' : ''} ${error ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        step={step}
        min={min}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  </div>
);

export const SelectInput = ({
  label,
  id,
  value,
  onChange,
  error,
  options = [],
  required = false,
  disabled = false,
  placeholder = 'Select an option'
}) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <select
      id={id}
      name={id}
      className={`form-select ${error ? 'is-invalid' : ''}`}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

export const TextareaInput = ({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  rows = 3,
  required = false
}) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <textarea
      id={id}
      name={id}
      rows={rows}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
    ></textarea>
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);
