import { pammHandlers } from './pamm'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { crmHandlers } from './crm'
import { tradeBookHandlers } from './tradeBook'
import { miscHandlers } from './misc'
import { ledgerHandlers } from './ledger'
import { paymentHandlers } from './payments'
import { bankRequestsHandlers } from './bankRequests'
import { vendorTransfersHandlers } from './vendorTransfers'
import { emailsHandlers } from './emails'
import { mediaHandlers } from './media'
import { whatsappHandlers } from './whatsapp'
import { watchlistHandlers } from './watchlist'
import { groupConfigHandlers } from './groupConfig'
import { companyIntegrationsHandlers } from './companyIntegrations'
import { misc2Handlers } from './misc2'
import { ibCommissionHandlers } from './ibCommission'
import { clientDepthHandlers } from './clientDepth'
import { paymentRequestsHandlers } from './paymentRequests'
import { cashbackHandlers } from './cashback'
import { ticketsHandlers } from './tickets'
import { notificationsHandlers } from './notifications'
import { tagsHandlers } from './tags'
import { catchAllHandlers } from './catchAll'
import { tradingAccountsHandlers } from './tradingAccounts'

export const handlers = [
  ...pammHandlers,
  ...authHandlers,
  ...dashboardHandlers,
  ...crmHandlers,
  ...tradeBookHandlers,
  ...miscHandlers,
  ...ledgerHandlers,
  ...paymentHandlers,
  ...paymentRequestsHandlers,
  ...cashbackHandlers,
  ...bankRequestsHandlers,
  ...vendorTransfersHandlers,
  ...emailsHandlers,
  ...mediaHandlers,
  ...whatsappHandlers,
  ...watchlistHandlers,
  ...groupConfigHandlers,
  ...companyIntegrationsHandlers,
  ...misc2Handlers,
  ...ibCommissionHandlers,
  ...clientDepthHandlers,
  ...ticketsHandlers,
  ...notificationsHandlers,
  ...tagsHandlers,
  ...tradingAccountsHandlers,
  ...catchAllHandlers
]
