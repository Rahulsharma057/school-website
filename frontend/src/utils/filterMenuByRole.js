export default function filterMenuByRole(menu = [], userRole = null) {
  return menu
    .filter((item) => {
      if (!item.visible) return false;

      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      return item.roles.includes(userRole);
    })
    .map((item) => ({
      ...item,

      children: (item.children || []).filter((child) => {
        if (!child.visible) return false;

        if (!child.roles || child.roles.length === 0) {
          return true;
        }

        return child.roles.includes(userRole);
      }),
    }));
}