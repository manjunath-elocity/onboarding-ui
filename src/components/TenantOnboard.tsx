import React, { useState } from "react";
import axios from "axios";
import { Card } from "./components/Card";
import { Input } from "./components/Input";
import { Select } from "./components/Select";
import { Button } from "./components/Button";
import { Switch } from "./components/Switch";
import { ColorPicker } from "./components/ColorPicker";
import { OnboardTenantDto } from "../../types/tenant";
import { ROLE } from "../../types/tenant";

const roleOptions = Object.entries(ROLE).map(([key, value]) => ({
  value,
  label: key.charAt(0) + key.slice(1).toUpperCase(),
}));

interface TenantOnboardProps {
  countryCodes: { value: string; label: string }[];
  countryCallingCodes: { value: string; label: string }[];
  onSubmit: (data: OnboardTenantDto) => void;
}

export default function TenantOnboard({
  onSubmit,
  countryCodes,
  countryCallingCodes,
}: TenantOnboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardTenantDto>({
    tenant: {
      partyId: "",
      countryCode: "",
      name: "",
      logoImageUrl: "",
      primaryColorCode: "#00A651",
      senderEmailId: "",
      androidAppUrl: "",
      iosAppUrl: "",
    },
    users: [
      {
        first_name: "",
        last_name: "",
        email: "",
        country_calling_code: "",
        contact_number: "",
        role: ROLE.AD,
        is_tenant_admin: true,
        disable2FA: false,
      },
    ],
    businessDetail: {
      name: "",
      websiteUrl: "",
      email: "",
      contactNumber: "",
      countryCallingCode: "",
      brandColor: "#00A651",
    },
    settings: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Tenant validation
    if (!formData.tenant.partyId && formData.tenant.partyId.length === 3)
      newErrors["tenant.partyId"] = "Party ID is required";
    if (!formData.tenant.countryCode) newErrors["tenant.countryCode"] = "Country Code is required";
    if (!formData.tenant.name) newErrors["tenant.name"] = "Name is required";
    if (formData.tenant.logoImageUrl && !isValidUrl(formData.tenant.logoImageUrl)) {
      newErrors["tenant.logoImageUrl"] = "Invalid URL format";
    }
    if (formData.tenant.androidAppUrl && !isValidUrl(formData.tenant.androidAppUrl)) {
      newErrors["tenant.androidAppUrl"] = "Invalid URL format";
    }
    if (formData.tenant.iosAppUrl && !isValidUrl(formData.tenant.iosAppUrl)) {
      newErrors["tenant.iosAppUrl"] = "Invalid URL format";
    }

    // Business validation
    if (!formData.businessDetail.name)
      newErrors["businessDetail.name"] = "Business name is required";
    if (!formData.businessDetail.email) newErrors["businessDetail.email"] = "Email is required";
    if (!isValidEmail(formData.businessDetail.email))
      newErrors["businessDetail.email"] = "Invalid email format";
    if (!formData.businessDetail.contactNumber)
      newErrors["businessDetail.contactNumber"] = "Contact number is required";
    if (!formData.businessDetail.countryCallingCode)
      newErrors["businessDetail.countryCallingCode"] = "Country calling code is required";
    if (formData.businessDetail.websiteUrl && !isValidUrl(formData.businessDetail.websiteUrl)) {
      newErrors["businessDetail.websiteUrl"] = "Invalid URL format";
    }

    // User validation
    formData.users.forEach((user, index) => {
      if (!user.first_name) newErrors[`users.${index}.first_name`] = "First name is required";
      if (!user.email) newErrors[`users.${index}.email`] = "Email is required";
      if (!isValidEmail(user.email)) newErrors[`users.${index}.email`] = "Invalid email format";
      if (!user.contact_number)
        newErrors[`users.${index}.contact_number`] = "Contact number is required";
      if (!user.country_calling_code)
        newErrors[`users.${index}.country_calling_code`] = "Country calling code is required";
    });

    // Settings validation
    (formData.settings ?? []).forEach((setting, index) => {
      if (!setting.key) newErrors[`settings.${index}.key`] = "Key is required";
      if (!setting.value) newErrors[`settings.${index}.value`] = "Value is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      onSubmit(formData);
      //   alert("Tenant onboarded successfully!");
      // Reset form or redirect
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "An error occurred while onboarding the tenant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    const keys = path.split(".");
    setFormData((prev) => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key === "users" && !isNaN(Number(keys[i + 1]))) {
          i++;
          current = current.users[Number(keys[i])];
        } else if (key === "settings" && !isNaN(Number(keys[i + 1]))) {
          i++;
          current = current.settings[Number(keys[i])];
        } else {
          current = current[key];
        }
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addUser = () => {
    setFormData((prev) => ({
      ...prev,
      users: [
        ...prev.users,
        {
          first_name: "",
          last_name: "",
          email: "",
          country_calling_code: "",
          contact_number: "",
          role: ROLE.AD,
          is_tenant_admin: false,
          disable2FA: false,
        },
      ],
    }));
  };

  const removeUser = (index: number) => {
    if (index === 0) return; // Don't remove the first user
    setFormData((prev) => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index),
    }));
  };

  const addSetting = () => {
    setFormData((prev) => ({
      ...prev,
      settings: [...(prev.settings || []), { key: "", value: "" }],
    }));
  };

  const removeSetting = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      settings: prev.settings?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title="Tenant Information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Input
            label="Party ID"
            required
            maxLength={3}
            value={formData.tenant.partyId.toLocaleUpperCase()}
            onChange={(e) => updateFormData("tenant.partyId", e.target.value.toUpperCase())}
            error={errors["tenant.partyId"]}
          />
          <Select
            label="Country"
            required
            options={countryCodes}
            value={formData.tenant.countryCode}
            onChange={(e) => updateFormData("tenant.countryCode", e.target.value)}
            error={errors["tenant.countryCode"]}
          />
          <Input
            label="Name"
            required
            value={formData.tenant.name}
            onChange={(e) => updateFormData("tenant.name", e.target.value)}
            error={errors["tenant.name"]}
          />
          <Input
            label="Logo URL"
            type="url"
            value={formData.tenant.logoImageUrl}
            onChange={(e) => updateFormData("tenant.logoImageUrl", e.target.value)}
            error={errors["tenant.logoImageUrl"]}
          />
          <ColorPicker
            label="Primary Color"
            value={formData.tenant.primaryColorCode || ""}
            onChange={(value) => updateFormData("tenant.primaryColorCode", value)}
            error={errors["tenant.primaryColorCode"]}
          />
          <Input
            label="Sender Email"
            type="email"
            value={formData.tenant.senderEmailId || ""}
            onChange={(e) => updateFormData("tenant.senderEmailId", e.target.value)}
            error={errors["tenant.senderEmailId"]}
          />
          <Input
            label="Android App URL"
            type="url"
            value={formData.tenant.androidAppUrl || ""}
            onChange={(e) => updateFormData("tenant.androidAppUrl", e.target.value)}
            error={errors["tenant.androidAppUrl"]}
          />
          <Input
            label="iOS App URL"
            type="url"
            value={formData.tenant.iosAppUrl || ""}
            onChange={(e) => updateFormData("tenant.iosAppUrl", e.target.value)}
            error={errors["tenant.iosAppUrl"]}
          />
        </div>
      </Card>

      <Card title="Business Details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Input
            label="Business Name"
            required
            value={formData.businessDetail.name}
            onChange={(e) => updateFormData("businessDetail.name", e.target.value)}
            error={errors["businessDetail.name"]}
          />
          <Input
            label="Website URL"
            type="url"
            value={formData.businessDetail.websiteUrl || ""}
            onChange={(e) => updateFormData("businessDetail.websiteUrl", e.target.value)}
            error={errors["businessDetail.websiteUrl"]}
          />
          <Input
            label="Primary Contact Email"
            type="email"
            required
            value={formData.businessDetail.email}
            onChange={(e) => updateFormData("businessDetail.email", e.target.value)}
            error={errors["businessDetail.email"]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Country Code"
              required
              options={countryCallingCodes}
              value={formData.businessDetail.countryCallingCode}
              onChange={(e) => updateFormData("businessDetail.countryCallingCode", e.target.value)}
              error={errors["businessDetail.countryCallingCode"]}
            />
            <Input
              label="Contact Number"
              required
              value={formData.businessDetail.contactNumber}
              onChange={(e) => updateFormData("businessDetail.contactNumber", e.target.value)}
              error={errors["businessDetail.contactNumber"]}
            />
          </div>
          <ColorPicker
            label="Brand Color"
            value={formData.businessDetail.brandColor || ""}
            onChange={(value) => updateFormData("businessDetail.brandColor", value)}
            error={errors["businessDetail.brandColor"]}
          />
        </div>
      </Card>

      <Card title="Users">
        {formData.users.map((user, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">User {index + 1}</h3>
              {index > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  icon="trash"
                  iconOnly
                  onClick={() => removeUser(index)}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Input
                label="First Name"
                required
                value={user.first_name}
                onChange={(e) => updateFormData(`users.${index}.first_name`, e.target.value)}
                error={errors[`users.${index}.first_name`]}
              />
              <Input
                label="Last Name"
                required
                value={user.last_name}
                onChange={(e) => updateFormData(`users.${index}.last_name`, e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                required
                value={user.email}
                onChange={(e) => updateFormData(`users.${index}.email`, e.target.value)}
                error={errors[`users.${index}.email`]}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Country Code"
                  required
                  options={countryCallingCodes}
                  value={user.country_calling_code}
                  onChange={(e) =>
                    updateFormData(`users.${index}.country_calling_code`, e.target.value)
                  }
                  error={errors[`users.${index}.country_calling_code`]}
                />
                <Input
                  label="Contact Number"
                  required
                  value={user.contact_number}
                  onChange={(e) => updateFormData(`users.${index}.contact_number`, e.target.value)}
                  error={errors[`users.${index}.contact_number`]}
                />
              </div>
              <Select
                label="Role"
                required
                options={roleOptions}
                value={user.role}
                onChange={(e) => updateFormData(`users.${index}.role`, e.target.value)}
                error={errors[`users.${index}.role`]}
              />
              <div className="col-span-full flex gap-4">
                <Switch
                  label="Tenant Admin"
                  checked={user.is_tenant_admin || false}
                  onChange={(value) => updateFormData(`users.${index}.is_tenant_admin`, value)}
                />
                <Switch
                  label="Disable Two-Factor Authentication"
                  checked={user.disable2FA || false}
                  onChange={(value) => updateFormData(`users.${index}.disable2FA`, value)}
                />
              </div>
            </div>
            {index < formData.users.length - 1 && <hr className="my-6 border-gray-200" />}
          </div>
        ))}
        <div className="mt-4">
          <Button type="button" variant="success" icon="plus" onClick={addUser}>
            Add User
          </Button>
        </div>
      </Card>

      <Card title="Settings">
        {formData.settings?.map((setting, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 items-start"
          >
            <Input
              label="Key"
              required
              value={setting.key}
              onChange={(e) => updateFormData(`settings.${index}.key`, e.target.value)}
              error={errors[`settings.${index}.key`]}
            />
            <Input
              label="Value"
              required
              value={setting.value}
              onChange={(e) => updateFormData(`settings.${index}.value`, e.target.value)}
              error={errors[`settings.${index}.value`]}
            />
            <div className="pt-7">
              <Button
                type="button"
                variant="danger"
                icon="trash"
                iconOnly
                onClick={() => removeSetting(index)}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="success" icon="plus" onClick={addSetting}>
          Add Setting
        </Button>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          loadingText="Onboarding..."
        >
          Onboard Tenant
        </Button>
      </div>
    </form>
  );
}
