import { useState } from "react";
import { Country, State, Currency } from "../../types/country";
import MultiSelectSearch from "./MultiSearch";
import MultiCurrencySelect from "./CurrencySelect";
import Papa from "papaparse";

interface CountryFormProps {
  existingCurrencies: Currency[];
  existingTimezones: string[];
  onSubmit: (countryData: Partial<Country>) => void;
  countryRelations: Map<
    string,
    {
      code_alpha_2: string;
      code_alpha_3: string;
      name: string;
      countryCallingCode: string;
      currency: Currency[];
      timezones: string[];
      state: Map<string, { name: string; code: string; cities: Set<string> }>;
    }
  >;
}

export default function UpdateCountry({
  onSubmit,
  existingCurrencies,
  existingTimezones,
  countryRelations,
}: CountryFormProps) {
  const [country, setCountry] = useState<Partial<Country>>({
    states: [],
    currency: [],
    timezones: [],
  });
  const [stateFile, setStateFile] = useState<File | null>(null);
  const [cityFile, setCityFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleCountryChange = (selectedCode: string) => {
    const selectedCountry = countryRelations.get(selectedCode);
    if (selectedCountry) {
      setCountry((prev) => ({
        ...prev,
        code_alpha_2: selectedCountry.code_alpha_2,
        code_alpha_3: selectedCountry.code_alpha_3,
        name: selectedCountry.name,
        countryCallingCode: selectedCountry.countryCallingCode,
        currency: selectedCountry.currency,
        timezones: existingTimezones.filter((tz) => selectedCountry.timezones.includes(tz)),
      }));
    }
  };

  // Templates for CSV download
  const stateTemplate = "code,name\n";
  const cityTemplate = "state_code,city_name\n";

  const handleSubmit = () => {
    // Optionally add validation here
    handleProcess();
    if (
      country.code_alpha_2 &&
      country.name &&
      country.code_alpha_3 &&
      country.countryCallingCode &&
      country.timezones?.length &&
      country.currency?.length
    ) {
      onSubmit(country);
    } else {
      setErrors(["Please fill out all required fields and process the CSV files."]);
    }
  };

  const downloadTemplate = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Utility to parse CSV into objects
  const parseCSV = (file: File) =>
    new Promise<any[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) reject(results.errors.map((e) => e.message));
          else resolve(results.data as any[]);
        },
        error: (err) => reject([err.message]),
      });
    });

  const handleProcess = async () => {
    const procErrors: string[] = [];

    if (!stateFile && !cityFile) {
      return;
    }

    // Build stateMap from CSV if given
    const stateMap: Record<string, { code: string; name: string; cities: string[] }> = {};
    const seenStateCodes = new Set<string>();

    if (stateFile) {
      try {
        const statesData = await parseCSV(stateFile);
        if (!statesData.length) {
          procErrors.push("State CSV is empty.");
        } else if (!("code" in statesData[0] && "name" in statesData[0])) {
          procErrors.push("State CSV must have 'code' and 'name' headers.");
        } else {
          statesData.forEach((row, idx) => {
            const code = String(row.code).trim();
            const name = String(row.name).trim();
            if (!code || !name) {
              procErrors.push(`Row ${idx + 2} in State CSV has empty 'code' or 'name'.`);
              return;
            }
            if (seenStateCodes.has(code)) {
              procErrors.push(`Duplicate state code '${code}' found at row ${idx + 2}.`);
            } else {
              seenStateCodes.add(code);
              stateMap[code] = { code, name, cities: [] };
            }
          });
        }
      } catch (e: any) {
        procErrors.push(...(Array.isArray(e) ? e : [String(e)]));
      }
    }

    // Process cities CSV if given
    if (cityFile) {
      try {
        const citiesData = await parseCSV(cityFile);
        if (!citiesData.length) {
          procErrors.push("City CSV is empty.");
        } else if (!("state_code" in citiesData[0] && "city_name" in citiesData[0])) {
          procErrors.push("City CSV must have 'state_code' and 'city_name' headers.");
        } else {
          citiesData.forEach((row, idx) => {
            const stateCode = String(row.state_code).trim();
            const cityName = String(row.city_name).trim();

            if (!stateCode || !cityName) {
              procErrors.push(`Row ${idx + 2} in City CSV has empty 'state_code' or 'city_name'.`);
              return;
            }

            if (stateMap[stateCode]) {
              // Case 1: state came from CSV
              stateMap[stateCode].cities.push(cityName);
            } else {
              // Case 2: try to pull from countryRelations
              const countryData = countryRelations.get(country.code_alpha_2 as string);
              const found = countryData?.state?.has(stateCode);

              if (found) {
                // initialize that state in our map
                const st = countryData?.state.get(stateCode)!;
                stateMap[stateCode] = {
                  code: st.code,
                  name: st.name,
                  cities: [cityName],
                };
              } else {
                // Case 3: not found anywhere → error
                procErrors.push(
                  `City '${cityName}' at row ${
                    idx + 2
                  } references unknown state code '${stateCode}'.`
                );
              }
            }
          });
        }
      } catch (e: any) {
        procErrors.push(...(Array.isArray(e) ? e : [String(e)]));
      }
    }
    Object.values(stateMap).forEach((st) => {
      const dupes = st.cities.filter((c, i, arr) => arr.indexOf(c) !== i);
      dupes.forEach((dup) =>
        procErrors.push(`Duplicate city '${dup}' found in state '${st.code}'.`)
      );
    });

    if (procErrors.length) {
      setErrors(procErrors);
    } else {
      setCountry((prev) => ({ ...prev, states: Object.values(stateMap) }));
      setErrors([]);
    }
  };

  return (
    <form className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <select
            required
            className="flex-1 p-2 border rounded"
            value={country.code_alpha_2 || ""}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            <option value="" disabled>
              Select Country Code
            </option>
            {Array.from(countryRelations.keys()).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            placeholder="Country Name"
            className="w-full p-2 border rounded"
            value={country.name || ""}
            onChange={(e) => setCountry((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            required
            placeholder="Alpha-3 Code"
            className="w-full p-2 border rounded"
            maxLength={3}
            value={country.code_alpha_3 || ""}
            onChange={(e) =>
              setCountry((prev) => ({ ...prev, code_alpha_3: e.target.value.toUpperCase() }))
            }
          />
          <input
            type="text"
            required
            placeholder="Calling Code"
            className="w-full p-2 border rounded"
            value={country.countryCallingCode || ""}
            onChange={(e) =>
              setCountry((prev) => ({ ...prev, countryCallingCode: e.target.value }))
            }
          />
        </div>
        <div className="space-y-4">
          <MultiSelectSearch
            label="Add or Remove Timezones"
            options={existingTimezones}
            value={country.timezones || []}
            onChange={(tzs) => setCountry((prev) => ({ ...prev, timezones: tzs }))}
          />
          <MultiCurrencySelect
            label="Add or Remove Currencies"
            options={existingCurrencies}
            value={country.currency || []}
            onChange={(currs) => setCountry((prev) => ({ ...prev, currency: currs }))}
          />
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Add New States & Cities</h3>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <label className="flex flex-col sm:flex-row sm:items-center flex-1">
              <span>State CSV:</span>
              <input
                required
                type="file"
                accept=".csv"
                onChange={(e) => setStateFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 sm:mt-0 sm:ml-2"
              />
            </label>
            <label className="flex flex-col sm:flex-row sm:items-center flex-1">
              <span>City CSV:</span>
              <input
                required
                type="file"
                accept=".csv"
                onChange={(e) => setCityFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 sm:mt-0 sm:ml-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 justify-end items-center">
            <button
              type="button"
              onClick={handleProcess}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Process CSVs
            </button>
            <button
              type="button"
              onClick={() => downloadTemplate(stateTemplate, "state_template.csv")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download State CSV Format
            </button>
            <button
              type="button"
              onClick={() => downloadTemplate(cityTemplate, "city_template.csv")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download City CSV Format
            </button>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded">
            <h4 className="font-semibold text-red-700">Errors:</h4>
            <ul className="list-disc list-inside text-red-600">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Save Country
        </button>
      </div>
    </form>
  );
}
