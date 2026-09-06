import React from "react";
import { LANGUAGE_OPTIONS } from "../config/languages";

const LanguageSelector = ({ value, onChange, disabled }) => (
  <label className="flex items-center gap-2 text-sm text-gray-300">
    <span>Language</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="rounded-md border border-gray-600 bg-[#1e1f2b] px-3 py-2 text-white outline-none focus:border-[#4aed88]"
    >
      {LANGUAGE_OPTIONS.map((language) => (
        <option key={language.value} value={language.value}>
          {language.label}
        </option>
      ))}
    </select>
  </label>
);

export default LanguageSelector;
