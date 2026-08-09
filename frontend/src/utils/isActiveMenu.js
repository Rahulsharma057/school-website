export default function isActiveMenu(pathname, url) {
  if (!pathname || !url) return false;

  if (pathname === url) {
    return true;
  }

  if (
    url !== "/" &&
    pathname.startsWith(url)
  ) {
    return true;
  }

  return false;
}