"use client";

import { useState, useEffect } from "react";
import { UploadIcon } from "@/assets/icons";
import { ShowcaseSection } from "@/components/layouts/showcase-section";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { uploadLogo } from "../api";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import type { OrganizationInfo } from "../api";

const LOGO_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/org-logos/";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

interface UploadLogoFormProps {
  organization: OrganizationInfo;
  onLogoUpdated?: () => void;
}

export function UploadLogoForm({
  organization,
  onLogoUpdated,
}: UploadLogoFormProps) {
  const { showToast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!organization?.logo) {
      setLogoUrl(null);
      return;
    }
    setLogoUrl(sanitizeImageUrl(organization.logo, LOGO_BASE_URL, null));
  }, [organization?.logo]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));
    const mimeType = file.type.toLowerCase();
    
    const isValidMimeType = mimeType && ALLOWED_MIME_TYPES.includes(mimeType);
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
      showToast({
        type: "error",
        title: "Invalid File",
        message: "Please select a JPEG or PNG image file",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast({
        type: "error",
        title: "File Too Large",
        message: "Please select an image smaller than 5MB",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      await uploadLogo(selectedFile);
      showToast({
        type: "success",
        title: "Logo Updated",
        message: "Organization logo has been updated successfully",
      });
      
      setPreviewUrl(null);
      setSelectedFile(null);
      
      if (onLogoUpdated) {
        onLogoUpdated();
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Upload Failed",
        message: e?.message || "Failed to upload logo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    
    const fileInput = document.getElementById("logoFile") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const displayUrl = previewUrl || logoUrl;

  return (
    <ShowcaseSection title="Organization Logo" className="!p-7">
      <form>
        <div className="mb-4 flex items-center gap-3">
          {displayUrl ? (
            <div className="relative size-14 overflow-hidden rounded-full">
              {(() => {
                const isExternalUrl = displayUrl.startsWith("http://") || displayUrl.startsWith("https://");
                const isBlobUrl = displayUrl.startsWith("blob:");
                
                if (isExternalUrl || isBlobUrl) {
                  return (
                    <img
                      src={displayUrl}
                      alt="Organization logo"
                      className="size-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== "/images/user.png") {
                          target.src = "/images/user.png";
                        }
                      }}
                    />
                  );
                }
                
                return (
                  <Image
                    src={displayUrl}
                    fill
                    alt="Organization logo"
                    className="object-cover"
                    sizes="56px"
                  />
                );
              })()}
            </div>
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-gray-2 dark:bg-dark-2">
              <span className="text-lg font-semibold text-dark-6 dark:text-dark-6">
                {organization.name?.charAt(0)?.toUpperCase() || "O"}
              </span>
            </div>
          )}

          <div>
            <span className="mb-1.5 block font-medium text-dark dark:text-white">
              Edit your logo
            </span>
            {previewUrl && (
              <span className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-body-sm hover:text-dark-6 dark:hover:text-dark-6"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="text-body-sm hover:text-primary disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Update"}
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-5.5 block w-full rounded-xl border border-dashed border-gray-4 bg-gray-2 hover:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary">
          <input
            type="file"
            name="logoFile"
            id="logoFile"
            accept="image/png, image/jpg, image/jpeg"
            hidden
            onChange={handleFileChange}
          />

          <label
            htmlFor="logoFile"
            className="flex cursor-pointer flex-col items-center justify-center p-4 sm:py-7.5"
          >
            <div className="flex size-13.5 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
              <UploadIcon />
            </div>

            <p className="mt-2.5 text-body-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and
              drop
            </p>

            <p className="mt-1 text-body-xs">
              SVG, PNG, JPG or GIF (max, 800 X 800px)
            </p>
          </label>
        </div>
      </form>
    </ShowcaseSection>
  );
}

