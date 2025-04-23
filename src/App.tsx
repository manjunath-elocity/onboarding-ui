import { UserCircle2 } from "lucide-react";
import { useState } from "react";
import AuthModal from "./components/AuthModal";
import CountryForm from "./components/CountryForm";
import { Country, Currency } from "../types/country";
import axios from "axios";
import UpdateCountry from "./components/UpdateCountry";
import { OnboardTenantDto } from "../types/tenant";
import TenantOnboard from "./components/TenantOnboard";

function App() {
  const [mode, setMode] = useState("addCountry");
  const [header, setHeader] = useState("Onboard New Country");
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "service_account@elocity.com",
    password: "cpms@123",
  });
  const [apiCalls, setApiCalls] = useState<
    { url: string; method: string; data: any; headers: { Authorization: string } }[]
  >([]);

  const [existingTimezones, setExistingTimezones] = useState<string[]>([]);
  const [existingCurrencies, setExistingCurrencies] = useState<Currency[]>([]);
  const [countryRelations, setCountryRelations] = useState<
    Map<
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
    >
  >(new Map());

  type Environment = "DEV" | "STG" | "UAT" | "INDIA_PROD" | "CANADA_PROD";

  const environments: Record<Environment, string> = {
    DEV: import.meta.env.VITE_DEV_URL,
    STG: import.meta.env.VITE_STG_URL,
    UAT: import.meta.env.VITE_UAT_URL,
    INDIA_PROD: import.meta.env.VITE_INDIA_PROD_URL,
    CANADA_PROD: import.meta.env.VITE_CANADA_PROD_URL,
  };

  const cpmsEnvironments: Record<Environment, string> = {
    DEV: import.meta.env.VITE_CPMS_DEV_URL,
    STG: import.meta.env.VITE_CPMS_STG_URL,
    UAT: import.meta.env.VITE_CPMS_UAT_URL,
    INDIA_PROD: import.meta.env.VITE_CPMS_INDIA_PROD_URL,
    CANADA_PROD: import.meta.env.VITE_CPMS_CANADA_PROD_URL,
  };
  type SelectedEnvironments = Record<Environment, boolean>;

  const [selectedEnvironments, setSelectedEnvironments] = useState<SelectedEnvironments>({
    DEV: false,
    STG: false,
    UAT: false,
    INDIA_PROD: false,
    CANADA_PROD: false,
  });

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMode = event.target.value;
    setMode(selectedMode);

    switch (selectedMode) {
      case "addTenant":
        setHeader("Onboard New Tenant");
        break;
      case "addCountry":
        setHeader("Add New Country");
        break;
      case "updateCountry":
        setHeader("Update Existing Country");
        break;
      default:
        setHeader("Onboard New Tenant");
    }
  };

  const handleEnvironmentChange = (env: Environment) => {
    setSelectedEnvironments((prev) => ({
      ...prev,
      [env]: !prev[env],
    }));
  };

  const getMetadataFromEnv = async (env: Environment) => {
    setLoading(true);
    const API_URL = cpmsEnvironments[env] + "metadata";
    const access_token = await getAccessToken(env);
    const headers = {
      Authorization: `Bearer ${access_token}`,
    };
    const shouldFilterByTenantId = "false";
    const types = [
      "CURRENCY",
      "TIMEZONE",
      "COUNTRY",
      "STATE",
      "CITY",
      "COUNTRY_CALLING_CODE",
      "COUNTRY_TIMEZONE",
      "COUNTRY_CURRENCY",
    ];
    const typesParamString = types.map((type) => `types=${type}&`).join("");
    const paramString = `${typesParamString}shouldFilterByTenantId=${shouldFilterByTenantId}`;
    const url = `${API_URL}?${paramString}`;
    try {
      const response = await axios.get(url, {
        headers: headers,
      });
      const data = response.data;

      const timezones: string[] =
        data.timezone?.map((timezone: { name: string }) => timezone.name) || [];
      const currencies = data.currency || [];

      // const countryStateCityMap: Map<string, Map<string, Set<string>>> = new Map();
      const countryRelations: Map<
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
      > = new Map();
      const { country, countryCallingCode, countryTimezones, countryCurrency } = response.data;

      for (const c of country) {
        const { code_alpha_2, code_alpha_3, name } = c;
        const call = countryCallingCode.find((c: any) => c.countryCode === code_alpha_2);
        const callingCode = call ? call.countryCallingCode : "";
        const timezones = countryTimezones
          .filter((c: any) => c.countryCode === code_alpha_2)
          .map((tz: any) => tz.timeZoneName);
        const currencyCodes = countryCurrency
          .filter((c: any) => c.countryCode === code_alpha_2)
          .map((c: any) => c.currencyCode);
        const currency = currencies.filter((c: any) => currencyCodes.includes(c.code));
        const stateMap = new Map<string, { name: string; code: string; cities: Set<string> }>();
        countryRelations.set(code_alpha_2, {
          code_alpha_2,
          code_alpha_3,
          name,
          countryCallingCode: callingCode,
          currency,
          timezones,
          state: stateMap,
        });
      }

      for (const { code, name, countryCode } of data.state) {
        const [, stateSuffix] = code.split("-");
        if (!stateSuffix) continue;
        const country = countryRelations.get(countryCode);
        if (!country) continue;
        let state = country.state.get(stateSuffix);
        if (!state) {
          state = { name, code: stateSuffix, cities: new Set<string>() };
          country.state.set(stateSuffix, state);
        }
      }

      for (const { country: countryCode, state: stateCode, name: cityName } of data.city) {
        const [, stateSuffix] = stateCode.split("-");
        if (!stateSuffix) continue;
        const country = countryRelations.get(countryCode);
        if (!country) continue;
        let state = country.state.get(stateSuffix);
        if (!state) continue;
        state.cities.add(cityName.trim());
      }

      return {
        countryRelations,
        timezones,
        currencies,
      };
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  async function getAccessToken(environment: Environment) {
    const API_URL = environments[environment] + "auth/user/login";
    const body = {
      username: credentials.username,
      password: credentials.password,
      override: true,
    };
    try {
      const response = await axios.post(API_URL, body);
      return response.data.access_token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      // throw error;
    }
  }

  const handleSubmitCountryForm = async (countryData: Partial<Country>) => {
    try {
      setLoading(true);
      const selectedEnvs = Object.keys(selectedEnvironments).filter(
        (env) => selectedEnvironments[env as Environment]
      );

      const envTokens = await Promise.all(
        selectedEnvs.map((env) => getAccessToken(env as Environment))
      );

      const calls = selectedEnvs.map((env, index) => {
        return {
          url: cpmsEnvironments[env as Environment] + "country",
          method: "POST",
          data: countryData,
          headers: {
            Authorization: `Bearer ${envTokens[index]}`,
          },
        };
      });
      setApiCalls(calls);

      // const promises = selectedEnvs.map((env, index) =>
      //   axios.post(cpmsEnvironments[env as Environment] + "country", countryData, {
      //     headers: {
      //       Authorization: `Bearer ${envTokens[index]}`,
      //     },
      //   })
      // );
      // await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  function removeEmptyStrings<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== "") // remove empty strings :contentReference[oaicite:0]{index=0}
    ) as Partial<T>;
  }

  const handleSubmitTenantForm = async (tenantData: OnboardTenantDto) => {
    try {
      setLoading(true);
      const selectedEnvs = Object.keys(selectedEnvironments).filter(
        (env) => selectedEnvironments[env as Environment]
      );

      const envTokens = await Promise.all(
        selectedEnvs.map((env) => getAccessToken(env as Environment))
      );

      const cleanedTenantData = {
        ...tenantData,
        tenant: removeEmptyStrings(tenantData.tenant),
        businessDetail: removeEmptyStrings(tenantData.businessDetail),
      };

      const calls = selectedEnvs.map((env, idx) => ({
        url: environments[env as Environment] + "tenant",
        method: "POST",
        data: cleanedTenantData,
        headers: { Authorization: `Bearer ${envTokens[idx]}` },
      }));
      setApiCalls(calls);

      const promises = selectedEnvs.map((env, idx) =>
        axios.post(environments[env as Environment] + "tenant/onboard", cleanedTenantData, {
          headers: { Authorization: `Bearer ${envTokens[idx]}` },
        })
      );
      await Promise.all(promises);

      alert("Tenant onboarded successfully!");
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAuthModalSubmit = async () => {
    setShowAuthModal(false); // Close the AuthModal
    const envs: Environment[] = ["STG", "UAT", "INDIA_PROD", "CANADA_PROD"];
    const results = await Promise.allSettled(envs.map((env) => getMetadataFromEnv(env)));
    const resolvedResults = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    const allTimezones = new Set<string>();
    const allCurrencies: Map<string, Currency> = new Map();
    resolvedResults.forEach((result) => {
      result.timezones.forEach((timezone: string) => allTimezones.add(timezone));
      result.currencies.forEach((currency: Currency) => {
        allCurrencies.set(currency.code, currency);
      });
    });
    setExistingTimezones(Array.from(allTimezones));
    setExistingCurrencies(Array.from(allCurrencies.values()));

    type CountryRel = {
      code_alpha_2: string;
      code_alpha_3: string;
      name: string;
      countryCallingCode: string;
      currency: Currency[];
      timezones: string[];
      state: Map<string, { name: string; code: string; cities: Set<string> }>;
    };
    const unifiedCountryRelations = new Map<string, CountryRel>();

    resolvedResults.forEach(({ countryRelations }) => {
      for (const [cc2, envCountry] of countryRelations.entries()) {
        if (!unifiedCountryRelations.has(cc2)) {
          // First time we see this country: clone deeply
          const clonedStates = new Map<
            string,
            { name: string; code: string; cities: Set<string> }
          >();
          envCountry.state.forEach((st: any, stCode: any) => {
            clonedStates.set(stCode, {
              name: st.name,
              code: st.code,
              cities: new Set(st.cities),
            });
          });

          unifiedCountryRelations.set(cc2, {
            code_alpha_2: envCountry.code_alpha_2,
            code_alpha_3: envCountry.code_alpha_3,
            name: envCountry.name,
            countryCallingCode: envCountry.countryCallingCode,
            currency: [...envCountry.currency],
            timezones: [...envCountry.timezones],
            state: clonedStates,
          });
        } else {
          // Merge into existing
          const existing = unifiedCountryRelations.get(cc2)!;
          // — currencies (dedupe by code)
          envCountry.currency.forEach((c: any) => {
            if (!existing.currency.some((ec) => ec.code === c.code)) {
              existing.currency.push(c);
            }
          });
          // — timezones
          envCountry.timezones.forEach((tz: any) => {
            if (!existing.timezones.includes(tz)) {
              existing.timezones.push(tz);
            }
          });
          // — states & cities
          envCountry.state.forEach((st: any, stCode: any) => {
            if (!existing.state.has(stCode)) {
              // brand‑new state
              existing.state.set(stCode, {
                name: st.name,
                code: stCode,
                cities: new Set(st.cities),
              });
            } else {
              // merge cities into existing state
              const es = existing.state.get(stCode)!;
              st.cities.forEach((city: any) => es.cities.add(city.trim()));
            }
          });
        }
      }
    });

    setCountryRelations(unifiedCountryRelations);

    console.log("Merged Country Relations:", unifiedCountryRelations);

    setLoading(false);
  };

  const ApiCallCard = ({ url, method, data, headers }: any) => (
    <div className="border p-4 mb-4 rounded shadow">
      <h4 className="font-bold">
        {method} {url}
      </h4>
      <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
      <h5 className="mt-4 font-bold">Headers:</h5>
      <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">{JSON.stringify(headers, null, 2)}</pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
          <select
            className="px-4 py-2 border rounded-lg bg-white shadow-sm"
            onChange={(event) => handleModeChange(event)}
          >
            <option value="addCountry">Add New Country</option>
            <option value="updateCountry">Update Existing Country</option>
            <option value="addTenant">Add New Tenant</option>
          </select>
          <h1 className="text-3xl font-bold text-gray-900">{header}</h1>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setShowAuthModal(!showAuthModal)}
          >
            <UserCircle2 className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 px-6 py-4">
          {(Object.keys(environments) as Environment[]).map((env) => (
            <label
              key={env}
              className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white shadow-sm hover:shadow-md cursor-pointer"
            >
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-green-600"
                checked={selectedEnvironments[env]}
                onChange={() => handleEnvironmentChange(env)}
              />
              <span className="text-sm font-medium text-gray-700">{env}</span>
            </label>
          ))}
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() =>
              setSelectedEnvironments(
                Object.keys(environments).reduce((acc, env) => {
                  acc[env as Environment] = true;
                  return acc;
                }, {} as SelectedEnvironments)
              )
            }
          >
            Select All
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center">
        {showAuthModal ? (
          <AuthModal
            isOpen={showAuthModal}
            credentials={credentials}
            setCredentials={setCredentials}
            onClose={handleAuthModalSubmit} // Trigger metadata fetch on close
          />
        ) : loading ? (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-500">Loading...</span>
              </div>
            </div>
          </div>
        ) : mode === "addCountry" ? (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm">
              <CountryForm
                onSubmit={handleSubmitCountryForm}
                existingTimezones={existingTimezones}
                existingCurrencies={existingCurrencies}
              />
            </div>
          </div>
        ) : mode == "updateCountry" ? (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm">
              <UpdateCountry
                onSubmit={handleSubmitCountryForm}
                existingTimezones={existingTimezones}
                existingCurrencies={existingCurrencies}
                countryRelations={countryRelations}
              />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm">
              <TenantOnboard
                onSubmit={handleSubmitTenantForm}
                countryCodes={Array.from(countryRelations).map(([code, details]) => ({
                  value: code,
                  label: details.name,
                }))}
                countryCallingCodes={Array.from(
                  Array.from(countryRelations.values()).reduce((map, details) => {
                    const existing = map.get(details.countryCallingCode);
                    if (existing) {
                      // Combine countries with the same calling code
                      map.set(details.countryCallingCode, `${existing}, ${details.name}`);
                    } else {
                      map.set(details.countryCallingCode, details.name);
                    }
                    return map;
                  }, new Map<string, string>())
                ).map(([value, label]) => ({
                  value,
                  label: `${value} (${label})`,
                }))}
              ></TenantOnboard>
            </div>
          </div>
        )}
      </div>

      {apiCalls.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">API Calls</h2>
          {apiCalls.map((call, index) => (
            <ApiCallCard key={index} {...call} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
