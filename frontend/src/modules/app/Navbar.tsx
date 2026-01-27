import {
  NavLink,
  Stack,
} from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENUS } from './Menu';
import classes from './Navbar.module.css'

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Stack gap="xs">
      {MENUS.map((menu) => (
        <NavLink
          key={menu.label}
          label={menu.label}
          leftSection={menu.icon && <menu.icon size={18} />}
          active={!!menu.path && location.pathname === menu.path}
          defaultOpened={!!menu.children}
          childrenOffset={28}
          classNames={{
            children: classes.children,
          }}
          onClick={() => {
            if (menu.path) navigate(menu.path);
          }}
        >
          {menu.children?.map((child) => (
            <NavLink
              key={child.path}
              label={child.label}
              active={location.pathname === child.path}
              onClick={() => navigate(child.path!)}
            />
          ))}
        </NavLink>
      ))}
    </Stack>
  );
}
