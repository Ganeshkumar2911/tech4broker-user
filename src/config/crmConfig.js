/**
 * Panther Capitals - CRM & Support Chat Widget Configuration
 */
export const CRM_CONFIG = {
  crmWidgetId: import.meta.env.VITE_CRM_WIDGET_ID || "eff0ef05-7839-4b58-b255-d2de15e203b3",
  companyName: "Panther Capitals",
  companyLogoUrl: "",
  phoneNumber: "447882740623",
  whatsappMessage: "Hello Panther Capitals Support, I need assistance.",
  get whatsappUrl() {
    return `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(this.whatsappMessage)}`;
  },
  scriptUrl: "https://d3r49s2alut4u1.cloudfront.net/js/widget.js",
  scriptId: "dt"
};
