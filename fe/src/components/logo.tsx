import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-10 w-[10.847rem]">
      <Image
        src={logo}
        fill
        className="dark:hidden object-contain"
        alt="Readee logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={darkLogo}
        fill
        className="hidden dark:block object-contain"
        alt="Readee logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
