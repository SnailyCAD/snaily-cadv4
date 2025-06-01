import type { Meta, StoryObj } from "@storybook/react";

import { Breadcrumbs } from "./breadcrumbs";
import { BreadcrumbItem } from "./breadcrumb-item";

const meta = {
  title: "Navigation/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <BreadcrumbItem href="/citizens" key="citizens">
        Citizens
      </BreadcrumbItem>,
      <BreadcrumbItem href="/citizens/john-doe" key="john-doe">
        John Doe
      </BreadcrumbItem>,
    ],
  },
};

export const ThreeDeepLevel: Story = {
  args: {
    children: [
      <BreadcrumbItem href="/admin" key="admin">
        Admin
      </BreadcrumbItem>,
      <BreadcrumbItem href="/admin/manage/users" key="admin-manage-users">
        Manage Users
      </BreadcrumbItem>,
      <BreadcrumbItem href="/admin/manage/users/john-doe" key="john-doe">
        Casper
      </BreadcrumbItem>,
    ],
  },
};

export const OneDeepLevel: Story = {
  args: {
    children: [
      <BreadcrumbItem href="/admin" key="admin">
        Admin
      </BreadcrumbItem>,
    ],
  },
};
