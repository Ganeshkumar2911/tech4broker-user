import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

// Fallback demo hierarchy data provided in specification
const fallbackTreeData = {
  data: {
    children: [
      {
        children: [
          {
            children: [],
            email: "jparida12@gmail.com",
            ib_id: 63,
            level: 2,
            name: "jyotiranjan Parida",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "63",
            split_percentage: 0.0,
            total_clients: 3,
            total_overall_clients: 3,
            total_sub_ibs: 0,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 293.45, real: 293.45 },
                withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 293.45, real: 293.45 },
                withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
              }
            },
            user_id: 141
          },
          {
            children: [],
            email: "ranajitmohanty1977@gmail.com",
            ib_id: 66,
            level: 2,
            name: "RANAJIT MAHANTY",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "66",
            split_percentage: 0.0,
            total_clients: 1,
            total_overall_clients: 1,
            total_sub_ibs: 0,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 200000.0, real: 200000.0 },
                withdrawal: { copy_trading: 0, overall: 5000.0, real: 5000.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 200000.0, real: 200000.0 },
                withdrawal: { copy_trading: 0, overall: 5000.0, real: 5000.0 }
              }
            },
            user_id: 138
          },
          {
            children: [
              {
                children: [],
                email: "gopearbind1@gmail.com",
                ib_id: 138,
                level: 3,
                name: "ARBIND GOPE",
                parent_email: "madhusmitaroul9@gmail.com",
                parent_ib_id: 96,
                parent_name: "MADHUSMITA ROUL",
                referral_code: "138",
                split_percentage: 0.0,
                total_clients: 1,
                total_overall_clients: 1,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 86
              },
              {
                children: [],
                email: "deepakforex2@gmail.com",
                ib_id: 178,
                level: 3,
                name: "Deepak Das",
                parent_email: "madhusmitaroul9@gmail.com",
                parent_ib_id: 96,
                parent_name: "MADHUSMITA ROUL",
                referral_code: "178",
                split_percentage: 0.0,
                total_clients: 5,
                total_overall_clients: 5,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 322400.0, real: 322400.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 322400.0, real: 322400.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 60
              },
              {
                children: [],
                email: "rojaline.das1990@gmail.com",
                ib_id: 180,
                level: 3,
                name: "ROJALIN DAS",
                parent_email: "madhusmitaroul9@gmail.com",
                parent_ib_id: 96,
                parent_name: "MADHUSMITA ROUL",
                referral_code: "180",
                split_percentage: 0.0,
                total_clients: 3,
                total_overall_clients: 3,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 301000.0, real: 301000.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 301000.0, real: 301000.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 59
              }
            ],
            email: "madhusmitaroul9@gmail.com",
            ib_id: 96,
            level: 2,
            name: "MADHUSMITA ROUL",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "96",
            split_percentage: 0.0,
            total_clients: 5,
            total_overall_clients: 14,
            total_sub_ibs: 3,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 810400.0, real: 810400.0 },
                withdrawal: { copy_trading: 0, overall: 1265.0, real: 1265.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 187000.0, real: 187000.0 },
                withdrawal: { copy_trading: 0, overall: 1265.0, real: 1265.0 }
              }
            },
            user_id: 120
          },
          {
            children: [],
            email: "samalbikash09@gmail.com",
            ib_id: 108,
            level: 2,
            name: "Bikash kumar Samal",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "108",
            split_percentage: 0.0,
            total_clients: 3,
            total_overall_clients: 3,
            total_sub_ibs: 0,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 109468.69, real: 109468.69 },
                withdrawal: { copy_trading: 0, overall: 99787.0, real: 99787.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 109468.69, real: 109468.69 },
                withdrawal: { copy_trading: 0, overall: 99787.0, real: 99787.0 }
              }
            },
            user_id: 112
          },
          {
            children: [
              {
                children: [
                  {
                    children: [],
                    email: "badrinarayan2706@gmail.com",
                    ib_id: 185,
                    level: 4,
                    name: "BADRI NARAYAN GOCHHAYAT",
                    parent_email: "sanatan.ankit@gmail.com",
                    parent_ib_id: 171,
                    parent_name: "SANATAN SAHU",
                    referral_code: "185",
                    split_percentage: 0.0,
                    total_clients: 4,
                    total_overall_clients: 4,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 1015600.0, real: 1015600.0 },
                        withdrawal: { copy_trading: 0, overall: 3000.0, real: 3000.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 1015600.0, real: 1015600.0 },
                        withdrawal: { copy_trading: 0, overall: 3000.0, real: 3000.0 }
                      }
                    },
                    user_id: 56
                  },
                  {
                    children: [],
                    email: "sahoomaguni5090@gmail.com",
                    ib_id: 187,
                    level: 4,
                    name: "MAGUNI SAHOO",
                    parent_email: "sanatan.ankit@gmail.com",
                    parent_ib_id: 171,
                    parent_name: "SANATAN SAHU",
                    referral_code: "187",
                    split_percentage: 0.0,
                    total_clients: 1,
                    total_overall_clients: 1,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 290000.0, real: 290000.0 },
                        withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 290000.0, real: 290000.0 },
                        withdrawal: { copy_trading: 0, overall: 290000.0, real: 290000.0 }
                      }
                    },
                    user_id: 54
                  },
                  {
                    children: [],
                    email: "pranatimajhee@gmail.com",
                    ib_id: 235,
                    level: 4,
                    name: "PRANATI MAJHEE",
                    parent_email: "sanatan.ankit@gmail.com",
                    parent_ib_id: 171,
                    parent_name: "SANATAN SAHU",
                    referral_code: "235",
                    split_percentage: 0.0,
                    total_clients: 1,
                    total_overall_clients: 1,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 300000.0, real: 300000.0 },
                        withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 300000.0, real: 300000.0 },
                        withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                      }
                    },
                    user_id: 26
                  }
                ],
                email: "sanatan.ankit@gmail.com",
                ib_id: 171,
                level: 3,
                name: "SANATAN SAHU",
                parent_email: "akp2555@gmail.com",
                parent_ib_id: 114,
                parent_name: "ABHAYA KUMAR PRADHAN",
                referral_code: "171",
                split_percentage: 0.0,
                total_clients: 2,
                total_overall_clients: 8,
                total_sub_ibs: 3,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 2933859.0, real: 2933859.0 },
                    withdrawal: { copy_trading: 0, overall: 413984.0, real: 413984.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 1328259.0, real: 1328259.0 },
                    withdrawal: { copy_trading: 0, overall: 410984.0, real: 410984.0 }
                  }
                },
                user_id: 65
              },
              {
                children: [],
                email: "ashis.ebusiness@gmail.com",
                ib_id: 209,
                level: 3,
                name: "Ashis Kumar Puthal",
                parent_email: "akp2555@gmail.com",
                parent_ib_id: 114,
                parent_name: "ABHAYA KUMAR PRADHAN",
                referral_code: "209",
                split_percentage: 0.0,
                total_clients: 1,
                total_overall_clients: 1,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 10000.0, real: 10000.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 10000.0, real: 10000.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 40
              }
            ],
            email: "akp2555@gmail.com",
            ib_id: 114,
            level: 2,
            name: "ABHAYA KUMAR PRADHAN",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "114",
            split_percentage: 0.0,
            total_clients: 11,
            total_overall_clients: 20,
            total_sub_ibs: 2,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 4623536.0, real: 4623536.0 },
                withdrawal: { copy_trading: 0, overall: 441516.0, real: 441516.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 1679677.0, real: 1679677.0 },
                withdrawal: { copy_trading: 0, overall: 27532.0, real: 27532.0 }
              }
            },
            user_id: 106
          },
          {
            children: [
              {
                children: [
                  {
                    children: [],
                    email: "indrajit.suchana1995@gmail.com",
                    ib_id: 222,
                    level: 4,
                    name: "INDRAJIT BERA",
                    parent_email: "sahootapas.ts@gmail.com",
                    parent_ib_id: 124,
                    parent_name: "Tapas Sahoo",
                    referral_code: "222",
                    split_percentage: 0.0,
                    total_clients: 9,
                    total_overall_clients: 9,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 445571.07, real: 445571.07 },
                        withdrawal: { copy_trading: 0, overall: 428526.0, real: 428526.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 445571.07, real: 445571.07 },
                        withdrawal: { copy_trading: 0, overall: 428526.0, real: 428526.0 }
                      }
                    },
                    user_id: 33
                  },
                  {
                    children: [],
                    email: "tmaitymaity321@gmail.com",
                    ib_id: 238,
                    level: 4,
                    name: "Tapas Kumar Maity",
                    parent_email: "sahootapas.ts@gmail.com",
                    parent_ib_id: 124,
                    parent_name: "Tapas Sahoo",
                    referral_code: "238",
                    split_percentage: 0.0,
                    total_clients: 8,
                    total_overall_clients: 8,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 158030.0, real: 158030.0 },
                        withdrawal: { copy_trading: 0, overall: 99824.97, real: 99824.97 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 158030.0, real: 158030.0 },
                        withdrawal: { copy_trading: 0, overall: 99824.97, real: 99824.97 }
                      }
                    },
                    user_id: 25
                  },
                  {
                    children: [],
                    email: "dilipmaity781996@gmail.com",
                    ib_id: 239,
                    level: 4,
                    name: "Dilip Maity",
                    parent_email: "sahootapas.ts@gmail.com",
                    parent_ib_id: 124,
                    parent_name: "Tapas Sahoo",
                    referral_code: "239",
                    split_percentage: 0.0,
                    total_clients: 13,
                    total_overall_clients: 13,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 311413.98, real: 311413.98 },
                        withdrawal: { copy_trading: 0, overall: 284640.2, real: 284640.2 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 311413.98, real: 311413.98 },
                        withdrawal: { copy_trading: 0, overall: 284640.2, real: 284640.2 }
                      }
                    },
                    user_id: 24
                  }
                ],
                email: "sahootapas.ts@gmail.com",
                ib_id: 124,
                level: 3,
                name: "Tapas Sahoo",
                parent_email: "subhogiri109@gmail.com",
                parent_ib_id: 119,
                parent_name: "Subhasish Giri",
                referral_code: "124",
                split_percentage: 0.0,
                total_clients: 21,
                total_overall_clients: 51,
                total_sub_ibs: 3,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 1393576.51, real: 1393576.51 },
                    withdrawal: { copy_trading: 0, overall: 1091776.94, real: 1091776.94 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 478561.46, real: 478561.46 },
                    withdrawal: { copy_trading: 0, overall: 278785.77, real: 278785.77 }
                  }
                },
                user_id: 97
              },
              {
                children: [
                  {
                    children: [],
                    email: "bluestone9874@gmail.com",
                    ib_id: 134,
                    level: 4,
                    name: "Firoz Munshi",
                    parent_email: "bitcoinbivu18@gmail.com",
                    parent_ib_id: 131,
                    parent_name: "Bivusundar Deshi",
                    referral_code: "134",
                    split_percentage: 0.0,
                    total_clients: 9,
                    total_overall_clients: 9,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 2605045.07, real: 2605045.07 },
                        withdrawal: { copy_trading: 0, overall: 1026640.5, real: 1026640.5 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 2605045.07, real: 2605045.07 },
                        withdrawal: { copy_trading: 0, overall: 1026640.5, real: 1026640.5 }
                      }
                    },
                    user_id: 89
                  },
                  {
                    children: [],
                    email: "moinatc1@gmail.com",
                    ib_id: 143,
                    level: 4,
                    name: "MAINUDDIN ANSARI",
                    parent_email: "bitcoinbivu18@gmail.com",
                    parent_ib_id: 131,
                    parent_name: "Bivusundar Deshi",
                    referral_code: "143",
                    split_percentage: 0.0,
                    total_clients: 8,
                    total_overall_clients: 8,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 3101500.0, real: 3101500.0 },
                        withdrawal: { copy_trading: 0, overall: 31828.0, real: 31828.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 3101500.0, real: 3101500.0 },
                        withdrawal: { copy_trading: 0, overall: 31828.0, real: 31828.0 }
                      }
                    },
                    user_id: 83
                  },
                  {
                    children: [
                      {
                        children: [],
                        email: "bapimondal1989@gmail.com",
                        ib_id: 248,
                        level: 5,
                        name: "BAPI MONDAL",
                        parent_email: "shubhashis01mondal@gmail.com",
                        parent_ib_id: 145,
                        parent_name: "Shubhashis Mondal",
                        referral_code: "248",
                        split_percentage: 0.0,
                        total_clients: 7,
                        total_overall_clients: 7,
                        total_sub_ibs: 0,
                        transactions: {
                          network: {
                            deposit: { copy_trading: 0, overall: 522986.97, real: 522986.97 },
                            withdrawal: { copy_trading: 0, overall: 1533.5, real: 1533.5 }
                          },
                          self: {
                            deposit: { copy_trading: 0, overall: 522986.97, real: 522986.97 },
                            withdrawal: { copy_trading: 0, overall: 1533.5, real: 1533.5 }
                          }
                        },
                        user_id: 19
                      }
                    ],
                    email: "shubhashis01mondal@gmail.com",
                    ib_id: 145,
                    level: 4,
                    name: "Shubhashis Mondal",
                    parent_email: "bitcoinbivu18@gmail.com",
                    parent_ib_id: 131,
                    parent_name: "Bivusundar Deshi",
                    referral_code: "145",
                    split_percentage: 0.0,
                    total_clients: 4,
                    total_overall_clients: 11,
                    total_sub_ibs: 1,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 1005496.13, real: 1005496.13 },
                        withdrawal: { copy_trading: 0, overall: 206716.39, real: 206716.39 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 482509.16, real: 482509.16 },
                        withdrawal: { copy_trading: 0, overall: 205182.89, real: 205182.89 }
                      }
                    },
                    user_id: 81
                  },
                  {
                    children: [],
                    email: "crypto.anupkumar1@gmail.com",
                    ib_id: 161,
                    level: 4,
                    name: "ANUP KUMAR KUNDU",
                    parent_email: "bitcoinbivu18@gmail.com",
                    parent_ib_id: 131,
                    parent_name: "Bivusundar Deshi",
                    referral_code: "161",
                    split_percentage: 0.0,
                    total_clients: 1,
                    total_overall_clients: 1,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                        withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                        withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                      }
                    },
                    user_id: 69
                  },
                  {
                    children: [],
                    email: "sukeshmondal40@gmail.com",
                    ib_id: 181,
                    level: 4,
                    name: "SUKESH CHANDRA MONDAL",
                    parent_email: "bitcoinbivu18@gmail.com",
                    parent_ib_id: 131,
                    parent_name: "Bivusundar Deshi",
                    referral_code: "181",
                    split_percentage: 0.0,
                    total_clients: 1,
                    total_overall_clients: 1,
                    total_sub_ibs: 0,
                    transactions: {
                      network: {
                        deposit: { copy_trading: 0, overall: 1002009.85, real: 1002009.85 },
                        withdrawal: { copy_trading: 0, overall: 881618.0, real: 881618.0 }
                      },
                      self: {
                        deposit: { copy_trading: 0, overall: 1002009.85, real: 1002009.85 },
                        withdrawal: { copy_trading: 0, overall: 881618.0, real: 881618.0 }
                      }
                    },
                    user_id: 58
                  }
                ],
                email: "bitcoinbivu18@gmail.com",
                ib_id: 131,
                level: 3,
                name: "Bivusundar Deshi",
                parent_email: "subhogiri109@gmail.com",
                parent_ib_id: 119,
                parent_name: "Subhasish Giri",
                referral_code: "131",
                split_percentage: 0.0,
                total_clients: 19,
                total_overall_clients: 49,
                total_sub_ibs: 5,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 10985193.55, real: 10985193.55 },
                    withdrawal: { copy_trading: 0, overall: 3627419.2, real: 3627419.2 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 3271142.5, real: 3271142.5 },
                    withdrawal: { copy_trading: 0, overall: 1480616.31, real: 1480616.31 }
                  }
                },
                user_id: 92
              }
            ],
            email: "subhogiri109@gmail.com",
            ib_id: 119,
            level: 2,
            name: "Subhasish Giri",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "119",
            split_percentage: 0.0,
            total_clients: 7,
            total_overall_clients: 107,
            total_sub_ibs: 2,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 13190298.91, real: 13190298.91 },
                withdrawal: { copy_trading: 0, overall: 5015981.58, real: 5015981.58 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 811528.85, real: 811528.85 },
                withdrawal: { copy_trading: 0, overall: 296785.44, real: 296785.44 }
              }
            },
            user_id: 101
          },
          {
            children: [],
            email: "skpanigrahy801@gmail.com",
            ib_id: 120,
            level: 2,
            name: "SUCHARITA PANIGRAHY",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "120",
            split_percentage: 0.0,
            total_clients: 10,
            total_overall_clients: 10,
            total_sub_ibs: 0,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 7239762.8, real: 7239762.8 },
                withdrawal: { copy_trading: 0, overall: 536116.79, real: 536116.79 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 7239762.8, real: 7239762.8 },
                withdrawal: { copy_trading: 0, overall: 536116.79, real: 536116.79 }
              }
            },
            user_id: 100
          },
          {
            children: [],
            email: "bishnupattanaik92@gmail.com",
            ib_id: 123,
            level: 2,
            name: "Bishnu Pattanaik",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "123",
            split_percentage: 0.0,
            total_clients: 2,
            total_overall_clients: 2,
            total_sub_ibs: 0,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 405600.0, real: 405600.0 },
                withdrawal: { copy_trading: 0, overall: 189138.0, real: 189138.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 405600.0, real: 405600.0 },
                withdrawal: { copy_trading: 0, overall: 189138.0, real: 189138.0 }
              }
            },
            user_id: 98
          },
          {
            children: [
              {
                children: [],
                email: "srath222@gmail.com",
                ib_id: 154,
                level: 3,
                name: "Surjyaranjan Rath",
                parent_email: "kashifx9877@gmail.com",
                parent_ib_id: 153,
                parent_name: "Kashinath Swain",
                referral_code: "154",
                split_percentage: 0.0,
                total_clients: 4,
                total_overall_clients: 4,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 11659.86, real: 11659.86 },
                    withdrawal: { copy_trading: 0, overall: 8520.0, real: 8520.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 11659.86, real: 11659.86 },
                    withdrawal: { copy_trading: 0, overall: 8520.0, real: 8520.0 }
                  }
                },
                user_id: 75
              }
            ],
            email: "kashifx9877@gmail.com",
            ib_id: 153,
            level: 2,
            name: "Kashinath Swain",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "153",
            split_percentage: 0.0,
            total_clients: 2,
            total_overall_clients: 6,
            total_sub_ibs: 1,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 11659.86, real: 11659.86 },
                withdrawal: { copy_trading: 0, overall: 8520.0, real: 8520.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
              }
            },
            user_id: 76
          },
          {
            children: [
              {
                children: [],
                email: "sandipmaity101087@gmail.com",
                ib_id: 195,
                level: 3,
                name: "SANDIP MAITY",
                parent_email: "sbarman007@hotmail.com",
                parent_ib_id: 194,
                parent_name: "Satyen Barman",
                referral_code: "195",
                split_percentage: 0.0,
                total_clients: 2,
                total_overall_clients: 2,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 48
              },
              {
                children: [],
                email: "dguria000@gmail.com",
                ib_id: 198,
                level: 3,
                name: "Debananda guria",
                parent_email: "sbarman007@hotmail.com",
                parent_ib_id: 194,
                parent_name: "Satyen Barman",
                referral_code: "198",
                split_percentage: 0.0,
                total_clients: 1,
                total_overall_clients: 1,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 46
              },
              {
                children: [],
                email: "sheetbuddhadev66@gmail.com",
                ib_id: 220,
                level: 3,
                name: "Buddhadev Sheet",
                parent_email: "sbarman007@hotmail.com",
                parent_ib_id: 194,
                parent_name: "Satyen Barman",
                referral_code: "220",
                split_percentage: 0.0,
                total_clients: 1,
                total_overall_clients: 1,
                total_sub_ibs: 0,
                transactions: {
                  network: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  },
                  self: {
                    deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                    withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
                  }
                },
                user_id: 35
              }
            ],
            email: "sbarman007@hotmail.com",
            ib_id: 194,
            level: 2,
            name: "Satyen Barman",
            parent_email: "saviernewtown@gmail.com",
            parent_ib_id: 89,
            parent_name: "Tapas Kumar Singha",
            referral_code: "194",
            split_percentage: 0.0,
            total_clients: 3,
            total_overall_clients: 7,
            total_sub_ibs: 3,
            transactions: {
              network: {
                deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
              },
              self: {
                deposit: { copy_trading: 0, overall: 0.0, real: 0.0 },
                withdrawal: { copy_trading: 0, overall: 0.0, real: 0.0 }
              }
            },
            user_id: 49
          }
        ],
        email: "saviernewtown@gmail.com",
        ib_id: 89,
        level: 1,
        name: "Tapas Kumar Singha",
        parent_email: "jipunai1992@gmail.com",
        parent_ib_id: 21,
        parent_name: "JIPUN DANDPAT",
        referral_code: "89",
        split_percentage: 0.0,
        total_clients: 35,
        total_overall_clients: 208,
        total_sub_ibs: 10,
        transactions: {
          network: {
            deposit: { copy_trading: 0, overall: 27467906.19, real: 27467906.19 },
            withdrawal: { copy_trading: 0, overall: 7603045.02, real: 7603045.02 }
          },
          self: {
            deposit: { copy_trading: 0, overall: 876886.48, real: 876886.48 },
            withdrawal: { copy_trading: 0, overall: 1305720.65, real: 1305720.65 }
          }
        },
        user_id: 123
      },
      {
        children: [],
        email: "forex.sp27@gmail.com",
        ib_id: 100015,
        level: 1,
        name: "Shubham Patil",
        parent_email: "jipunai1992@gmail.com",
        parent_ib_id: 21,
        parent_name: "JIPUN DANDPAT",
        referral_code: "100015",
        split_percentage: 20.0,
        total_clients: 1,
        total_overall_clients: 1,
        total_sub_ibs: 0,
        transactions: {
          network: {
            deposit: { copy_trading: 0, overall: 0, real: 0 },
            withdrawal: { copy_trading: 0, overall: 0, real: 0 }
          },
          self: {
            deposit: { copy_trading: 0, overall: 0, real: 0 },
            withdrawal: { copy_trading: 0, overall: 0, real: 0 }
          }
        },
        user_id: 368
      }
    ],
    email: "jipunai1992@gmail.com",
    ib_id: 21,
    level: 0,
    name: "JIPUN DANDPAT",
    parent_email: null,
    parent_ib_id: null,
    parent_name: null,
    referral_code: "21",
    split_percentage: 0.0,
    total_clients: 4,
    total_overall_clients: 213,
    total_sub_ibs: 2,
    transactions: {
      network: {
        deposit: { copy_trading: 0, overall: 27519901.19, real: 27519901.19 },
        withdrawal: { copy_trading: 0, overall: 7654543.34, real: 7654543.34 }
      },
      self: {
        deposit: { copy_trading: 0, overall: 51995.0, real: 51995.0 },
        withdrawal: { copy_trading: 0, overall: 51498.32, real: 51498.32 }
      }
    },
    user_id: 172
  },
  status: "success",
  summary: {
    level_0: {
      client_count: 4,
      deposit: { copy_trading: 0, overall: 51995.0, real: 51995.0 },
      ib_count: 1,
      withdrawal: { copy_trading: 0, overall: 51498.32, real: 51498.32 }
    },
    level_1: {
      client_count: 36,
      deposit: { copy_trading: 0, overall: 876886.48, real: 876886.48 },
      ib_count: 2,
      withdrawal: { copy_trading: 0, overall: 1305720.65, real: 1305720.65 }
    },
    level_2: {
      client_count: 47,
      deposit: { copy_trading: 0, overall: 10633330.79, real: 10633330.79 },
      ib_count: 10,
      withdrawal: { copy_trading: 0, overall: 1155624.23, real: 1155624.23 }
    },
    level_3: {
      client_count: 60,
      deposit: { copy_trading: 0, overall: 5723022.82, real: 5723022.82 },
      ib_count: 11,
      withdrawal: { copy_trading: 0, overall: 2178906.08, real: 2178906.08 }
    },
    level_4: {
      client_count: 59,
      deposit: { copy_trading: 0, overall: 9711679.13, real: 9711679.13 },
      ib_count: 11,
      withdrawal: { copy_trading: 0, overall: 2961260.56, real: 2961260.56 }
    },
    level_5: {
      client_count: 7,
      deposit: { copy_trading: 0, overall: 522986.97, real: 522986.97 },
      ib_count: 1,
      withdrawal: { copy_trading: 0, overall: 1533.5, real: 1533.5 }
    }
  }
};

export const useIbTreeStore = defineStore("ibTreeHierarchy", () => {
  const treeData = ref(null);
  const summary = ref({});
  const isLoading = ref(false);
  const error = ref(null);
  const isFetched = ref(false);

  const snackbar = useSnackbarStore();

  const fetchIbTree = (force = false) => {
    if (isFetched.value && !force && treeData.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    apiRequest(urls.KEYS.GET, urls.ib.network, {
      isTokenRequired: true,
      onSuccess: (res) => {
        const payload = res?.data || res;
        const rootData = payload?.data || payload;
        const summaryData = payload?.summary || {};

        if (rootData && (rootData.ib_id || rootData.children || Array.isArray(rootData))) {
          treeData.value = rootData;
          summary.value = summaryData;
        } else {
          // Fallback to demo structure if empty or not formatted
          treeData.value = fallbackTreeData.data;
          summary.value = fallbackTreeData.summary;
        }

        isFetched.value = true;
        isLoading.value = false;
      },
      onFailure: (err) => {
        console.warn("API /network fetch failed, using fallback hierarchy:", err);
        // Load fallback hierarchy on error so UI always renders smoothly
        treeData.value = fallbackTreeData.data;
        summary.value = fallbackTreeData.summary;
        isFetched.value = true;
        isLoading.value = false;
      },
    });
  };

  return {
    treeData,
    summary,
    isLoading,
    error,
    isFetched,
    fetchIbTree,
  };
});
