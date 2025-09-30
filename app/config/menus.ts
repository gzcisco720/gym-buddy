
import {
  DashBoard,
  BodyTest,
} from "@/components/svg";


export interface MenuItemProps {
  title: string;
  icon?: any;
  href?: string;
  child?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  nested?: MenuItemProps[];
  onClick?: () => void;
  isHeader?: boolean;
}

export const menusConfig = {
  mainNav: [
      {
      title: "Dashboard",
      icon: DashBoard,
      href: "/overview",
    },
    {
      title: "Body Test",
      icon: BodyTest,
      href: "/body-test",
    },
  ],
  sidebarNav: {
    modern: [
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/overview",
      },
      {
        title: "Body Test",
        icon: BodyTest,
        href: "/body-test",
      },
    ],
    classic: [
       {
        isHeader: true,
        title: "menu",
      },
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/overview",
      },
      {
        isHeader: true,
        title: "fitness",
      },
      {
        title: "Body Test",
        icon: BodyTest,
        href: "/body-test",
      },
    ],
  },
};


export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number]
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number]
export type MainNavType = (typeof menusConfig.mainNav)[number]