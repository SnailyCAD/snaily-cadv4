type AccountMessages = typeof import("./locales/en/account.json");
type AdminMessages = typeof import("./locales/en/admin.json");
type AuthMessages = typeof import("./locales/en/auth.json");
type BleeterMessages = typeof import("./locales/en/bleeter.json");
type BusinessMessages = typeof import("./locales/en/business.json");
type callsMessages = typeof import("./locales/en/calls.json");
type CitizenMessages = typeof import("./locales/en/citizen.json");
type CommonMessages = typeof import("./locales/en/common.json");
type CourthouseMessages = typeof import("./locales/en/courthouse.json");
type EmsMessages = typeof import("./locales/en/ems-fd.json");
type leoMessages = typeof import("./locales/en/leo.json");
type TruckMessages = typeof import("./locales/en/truck-logs.json");
type ValuesMessages = typeof import("./locales/en/values.json");

declare interface IntlMessages
  extends AccountMessages,
    AdminMessages,
    AuthMessages,
    BleeterMessages,
    BusinessMessages,
    callsMessages,
    CitizenMessages,
    CommonMessages,
    CourthouseMessages,
    EmsMessages,
    leoMessages,
    TruckMessages,
    ValuesMessages {}
