import { Breadcrumbs, Anchor, Text } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { MENUS } from "./Menu";

type BreadcrumbItem = {
  label: string;
  path?: string;
};

function findPath(
  menus: any[],
  pathname: string
): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = [];

  function dfs(items: any[], parents: any[]): boolean {
    for (const m of items) {
      const current = [...parents, m];

      if (m.path === pathname) {
        current.forEach((i) =>
          result.push({ label: i.label, path: i.path })
        );
        return true;
      }

      if (m.children && dfs(m.children, current)) {
        return true;
      }
    }
    return false;
  }

  dfs(menus, []);
  return result;
}

export function AppBreadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/") return null;

  const items = findPath(MENUS, location.pathname);

  if (!items.length) return null;

  return (
    <Breadcrumbs mb="md">
      {items.map((item, index) =>
        index === items.length - 1 ? (
          <Text key={index} fw={600}>
            {item.label}
          </Text>
        ) : (
          <Anchor
            key={index}
            onClick={() => item.path && navigate(item.path)}
          >
            {item.label}
          </Anchor>
        )
      )}
    </Breadcrumbs>
  );
}
