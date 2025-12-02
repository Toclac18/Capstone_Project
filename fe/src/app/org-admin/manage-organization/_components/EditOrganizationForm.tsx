"use client";

import { useState, useEffect } from "react";
import { Building2, AlertCircle, MapPin } from "lucide-react";
import {
  UserIcon,
  EmailIcon,
  CallIcon,
} from "@/assets/icons";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/layouts/showcase-section";
import type { OrganizationInfo, UpdateOrganizationData } from "../api";

const ORGANIZATION_TYPES = [
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "TRAINING_CENTER", label: "Training Center" },
] as const;

interface EditOrganizationFormProps {
  organization: OrganizationInfo;
  onSave: (data: UpdateOrganizationData) => Promise<void>;
  onCancel: () => void;
}

export default function EditOrganizationForm({
  organization,
  onSave,
  onCancel,
}: EditOrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    name: "",
    type: "",
    email: "",
    hotline: "",
    address: "",
    registrationNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization) {
      setFormData({
        fullName: organization.adminName || "",
        name: organization.name || "",
        type: organization.type || "",
        email: organization.email || "",
        hotline: organization.hotline || "",
        address: organization.address || "",
        registrationNumber: organization.registrationNumber || "",
      });
      setErrors({});
    }
  }, [organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedFullName = formData.fullName.trim();
    if (!trimmedFullName) {
      newErrors.fullName = "Admin name is required";
    }

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Organization name is required";
    }

    const trimmedType = formData.type.trim();
    if (!trimmedType) {
      newErrors.type = "Organization type is required";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Organization email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Invalid email format";
    }

    const trimmedRegNumber = formData.registrationNumber.trim();
    if (!trimmedRegNumber) {
      newErrors.registrationNumber = "Registration number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSave({
        fullName: formData.fullName.trim(),
        name: formData.name.trim(),
        type: formData.type.trim(),
        email: formData.email.trim(),
        hotline: formData.hotline.trim() || undefined,
        address: formData.address.trim() || undefined,
        registrationNumber: formData.registrationNumber.trim(),
      });
    } catch (error: any) {
      setErrors({ submit: error?.message || "Failed to update organization" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShowcaseSection title="Organization Information" className="!p-7">
      <form onSubmit={handleSubmit}>
        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="fullName"
            label="Admin Name"
            placeholder="Enter admin name"
            value={formData.fullName}
            handleChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, fullName: value });
              if (errors.fullName) {
                setErrors({ ...errors, fullName: "" });
              }
            }}
            icon={<UserIcon />}
            iconPosition="left"
            height="sm"
            required
            error={errors.fullName}
          />

          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="name"
            label="Organization Name"
            placeholder="Enter organization name"
            value={formData.name}
            handleChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, name: value });
              if (errors.name) {
                setErrors({ ...errors, name: "" });
              }
            }}
            icon={<Building2 className="w-5 h-5" />}
            iconPosition="left"
            height="sm"
            required
            error={errors.name}
          />
        </div>

        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
          <div className="w-full sm:w-1/2">
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              Organization Type <span className="ml-1 select-none text-red">*</span>
            </label>
            <div className="relative mt-3">
              <select
                name="type"
                value={formData.type}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, type: value });
                  if (errors.type) {
                    setErrors({ ...errors, type: "" });
                  }
                }}
                className={`w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-2.5 text-dark outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-2 dark:bg-dark-2 dark:text-white dark:focus:border-primary dark:disabled:bg-dark min-h-[42px] ${
                  errors.type
                    ? "border-red focus:border-red dark:border-red"
                    : "border-stroke dark:border-dark-3"
                }`}
                required
              >
                <option value="">Select organization type</option>
                {ORGANIZATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.type && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.type}
              </p>
            )}
          </div>

          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="registrationNumber"
            label="Registration Number"
            placeholder="Enter registration number"
            value={formData.registrationNumber}
            handleChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, registrationNumber: value });
              if (errors.registrationNumber) {
                setErrors({ ...errors, registrationNumber: "" });
              }
            }}
            icon={<Building2 className="w-5 h-5" />}
            iconPosition="left"
            height="sm"
            required
            error={errors.registrationNumber}
          />
        </div>

        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
          <InputGroup
            className="w-full sm:w-1/2"
            type="email"
            name="email"
            label="Organization Email"
            placeholder="Enter organization email"
            value={formData.email}
            handleChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, email: value });
              if (errors.email) {
                setErrors({ ...errors, email: "" });
              }
            }}
            icon={<EmailIcon />}
            iconPosition="left"
            height="sm"
            required
            error={errors.email}
          />

          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="hotline"
            label="Hotline"
            placeholder="Enter hotline"
            value={formData.hotline}
            handleChange={(e) => {
              setFormData({ ...formData, hotline: e.target.value });
            }}
            icon={<CallIcon />}
            iconPosition="left"
            height="sm"
          />
        </div>

        <InputGroup
          className="mb-5.5"
          type="text"
          name="address"
          label="Address"
          placeholder="Enter address"
          value={formData.address}
          handleChange={(e) => {
            setFormData({ ...formData, address: e.target.value });
          }}
          icon={
            <MapPin className="w-5 h-5" style={{ color: "currentColor" }} />
          }
          iconPosition="left"
          height="sm"
        />

        {errors.submit && (
          <div className="mb-5.5 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{errors.submit}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}

