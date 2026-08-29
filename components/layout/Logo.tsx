import Image from "next/image";

export default function Logo({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "icon";
}) {
  const sizeClass = variant === "icon" ? "h-12 w-12 object-cover object-left" : "h-11 sm:h-12 w-auto";

  return (
    <Image
      src="/images/siri-windows-logo.png"
      alt="Siri Enterprises logo"
      width={2007}
      height={680}
      priority
      className={`${sizeClass} object-contain ${className}`}
    />
  );
}
