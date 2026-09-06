// Join class names, dropping falsy values. (Same role as aistp-platform's lib/cn.js,
// minus clsx/tailwind-merge since this project uses plain CSS.)
export function cn(...parts) {
  return parts
    .flat()
    .filter(Boolean)
    .join(" ");
}
