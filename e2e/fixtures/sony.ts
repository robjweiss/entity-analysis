// App-facing data captured from Sayari BFF responses for Sony Group - Suppliers.
// Entity name/country search pages contain subsets of this observed first page.
const projectEntities = [
  {
    id: '34A6Aj',
    label: 'SK hynix Inc.',
    countries: [
      'USA',
      'AUS',
      'KOR',
      'SGP',
      'CAN',
      'JPN',
      'MEX',
      'CHN',
      'FRA',
      'TWN',
      'GBR',
      'MYS',
      'POL',
      'VNM',
      'HND',
      'HKG',
    ],
    riskCategories: [
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'sanctions',
        label: 'Sanctions',
      },
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
    ],
    riskFactors: [
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory Action',
      },
      {
        id: 'esg_score_medium',
        label: 'Medium Risk ESG Controversy Exposure Score',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
      },
      {
        id: 'pep_adjacent',
        label: 'Related to Politically Exposed Person (PEP)',
      },
      {
        id: 'sanctioned_adjacent',
        label: 'Related to Sanctioned',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_direct',
        label:
          'Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_direct',
        label:
          "Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'owned_by_regulatory_action_entity',
        label: 'Owned by Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
    ],
    riskSeverity: 'high',
    matches: [
      {
        id: 'LND2ky2zBXWwocEd8qCL-w',
        label: 'SK HYNIX AMERICA INC',
      },
    ],
  },
  {
    id: '7MA3AQ',
    label: 'Texas Instruments Incorporated',
    countries: [
      'SGP',
      'ROU',
      'HUN',
      'USA',
      'POL',
      'KOR',
      'DNK',
      'FRA',
      'GBR',
      'AUT',
      'NLD',
      'HKG',
      'CZE',
      'NOR',
      'AUS',
      'ISR',
      'DEU',
      'SWE',
      'CHN',
      'PHL',
      'MYS',
      'CAN',
      'JPN',
      'BRA',
      'TWN',
      'MEX',
      'ITA',
      'IND',
      'BEL',
      'MAC',
      'TUR',
      'THA',
      'CHE',
      'ESP',
      'RUS',
      'CRI',
      'PRT',
    ],
    riskCategories: [
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'sanctions',
        label: 'Sanctions',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
    ],
    riskFactors: [
      {
        id: 'soe_adjacent',
        label: 'Related to State-Owned Enterprise (SOE)',
      },
      {
        id: 'export_controls_adjacent',
        label: 'Related to Export Controls',
      },
      {
        id: 'sanctioned_adjacent',
        label: 'Related to Sanctioned',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'owned_by_regulatory_action_entity',
        label: 'Owned by Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'esg_score_medium',
        label: 'Medium Risk ESG Controversy Exposure Score',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: '8zAaAV',
    label: 'Qualcomm Incorporated',
    countries: [
      'USA',
      'AUS',
      'CAN',
      'MEX',
      'GBR',
      'KOR',
      'SGP',
      'CHN',
      'ESP',
      'RUS',
      'VNM',
      'TWN',
      'NZL',
      'SWE',
      'DEU',
      'IRL',
    ],
    riskCategories: [
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
    ],
    riskFactors: [
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory Action',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'owner_of_regulatory_action_entity',
        label: 'Owner of Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'psa_regulatory_action',
        label: 'Possibly the Same As (PSA) an Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'psa_owner_of_soe',
        label: "Owner of State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
      {
        id: 'psa_owner_of_usa_section_1260h_entity',
        label: "Owner of USA NDAA Section 1260H List Entity (May Include 'PSA' Path)",
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: 'DqAmAo',
    label: 'Panasonic Holdings Corporation',
    countries: [
      'ESP',
      'SGP',
      'BEL',
      'USA',
      'FIN',
      'PRT',
      'JPN',
      'ITA',
      'HKG',
      'CZE',
      'CHN',
      'SWE',
      'AUS',
      'VNM',
      'THA',
      'DEU',
      'IDN',
      'KOR',
      'GBR',
      'PHL',
      'CAN',
      'TWN',
      'MYS',
      'PAN',
      'NLD',
      'PAK',
      'MEX',
      'NGA',
      'DNK',
      'AUT',
      'NOR',
      'IND',
      'IRL',
      'GGY',
      'ZWE',
      'NZL',
    ],
    riskCategories: [
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
    ],
    riskFactors: [
      {
        id: 'soe_adjacent',
        label: 'Related to State-Owned Enterprise (SOE)',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_direct',
        label:
          "Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'export_to_soe',
        label: 'Export to State-Owned Enterprise (SOE)',
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'exports_bis_high_priority_items_direct',
        label:
          'Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_export_to_soe',
        label: "Export to State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
      {
        id: 'owned_by_regulatory_action_entity',
        label: 'Owned by Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'law_enforcement_action_historic',
        label: 'Law Enforcement Action (Historic)',
      },
      {
        id: 'law_enforcement_action',
        label: 'Law Enforcement Action (from Adverse Media)',
      },
      {
        id: 'esg_score_high',
        label: 'High Risk ESG Controversy Exposure Score',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
      },
      {
        id: 'chinese_soe_adjacent',
        label: 'Related to Chinese State-Owned Enterprise',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory Action',
      },
      {
        id: 'owner_of_soe',
        label: 'Owner of State-Owned Enterprise (SOE)',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'owner_of_regulatory_action_entity',
        label: 'Owner of Entity Subject to Regulatory Action',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_direct',
        label:
          'Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_owner_of_chinese_soe',
        label: "Owner of Chinese State-Owned Enterprise (May Include 'PSA' Path)",
      },
      {
        id: 'owner_of_chinese_soe',
        label: 'Owner of Chinese State-Owned Enterprise',
      },
      {
        id: 'psa_owner_of_soe',
        label: "Owner of State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_direct',
        label:
          "Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: 'KoAmAK',
    label: 'TDK Corporation',
    countries: ['JPN', 'USA', 'GBR', 'TWN', 'HKG', 'CHN', 'AUT', 'NLD', 'SWE', 'LUX', 'DEU', 'CAN'],
    riskCategories: [
      {
        id: 'sanctions_and_export_control_lists',
        label: 'Sanctions and export control lists',
      },
      {
        id: 'sanctions',
        label: 'Sanctions',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
    ],
    riskFactors: [
      {
        id: 'psa_sanctioned',
        label: 'Possibly the Same As (PSA) a Sanctioned Entity',
      },
      {
        id: 'psa_sanctioned_other',
        label: 'Possibly the Same As (PSA) a Sanctioned Entity',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'sanctioned_other',
        label: 'Sanctioned under other International Sanctions Lists',
      },
      {
        id: 'sanctioned',
        label: 'Sanctioned',
      },
    ],
    riskSeverity: 'critical',
  },
  {
    id: 'd4NpNO',
    label: 'ROHM Co., Ltd.',
    countries: [
      'SGP',
      'BEL',
      'DEU',
      'JPN',
      'GBR',
      'NLD',
      'USA',
      'TUR',
      'ESP',
      'LTU',
      'BGR',
      'KOR',
      'HUN',
      'FRA',
      'CZE',
      'CHN',
      'TWN',
      'CHE',
      'HKG',
      'VNM',
      'THA',
      'IDN',
      'PHL',
      'MYS',
      'PCN',
      'AUS',
    ],
    riskCategories: [
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
    ],
    riskFactors: [
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'owned_by_regulatory_action_entity',
        label: 'Owned by Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'exports_bis_high_priority_items_indirect',
        label:
          'Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_indirect',
        label:
          "Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'soe_adjacent',
        label: 'Related to State-Owned Enterprise (SOE)',
      },
      {
        id: 'export_to_soe',
        label: 'Export to State-Owned Enterprise (SOE)',
      },
      {
        id: 'psa_export_to_soe',
        label: "Export to State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: 'AxAjAx',
    label: 'Hon Hai Precision Industry Co., Ltd.',
    countries: [
      'MEX',
      'ESP',
      'SGP',
      'CHN',
      'TWN',
      'USA',
      'POL',
      'FRA',
      'GBR',
      'ITA',
      'NZL',
      'IRL',
      'HKG',
      'CZE',
      'ISR',
      'KOR',
      'VNM',
      'CAN',
      'ARE',
      'THA',
      'DEU',
      'COL',
      'TUR',
      'DNK',
      'AUT',
      'SAU',
      'BRA',
      'CHL',
      'PHL',
      'MYS',
      'ZAF',
      'JPN',
      'AUS',
      'IND',
      'NLD',
    ],
    riskCategories: [
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
    ],
    riskFactors: [
      {
        id: 'esg_score_medium',
        label: 'Medium Risk ESG Controversy Exposure Score',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'owner_of_regulatory_action_entity',
        label: 'Owner of Entity Subject to Regulatory Action',
      },
      {
        id: 'psa_exports_bis_high_priority_items_direct',
        label:
          "Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'exports_bis_high_priority_items_direct',
        label:
          'Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'psa_forced_labor_aspi_uyghur',
        label: 'Possibly the Same As (PSA) ASPI Forced Labor Report Entity',
      },
      {
        id: 'psa_regulatory_action',
        label: 'Possibly the Same As (PSA) an Entity Subject to Regulatory Action',
      },
      {
        id: 'exports_bis_high_priority_items_indirect',
        label:
          'Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_indirect',
        label:
          "Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory Action',
      },
      {
        id: 'soe_adjacent',
        label: 'Related to State-Owned Enterprise (SOE)',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
      },
      {
        id: 'pep_adjacent',
        label: 'Related to Politically Exposed Person (PEP)',
      },
      {
        id: 'aspi_uyghur_forced_labor_report_entity',
        label: 'Entity from ASPI Forced Labor Report',
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: 'vdN7Ny',
    label: 'Samsung Electronics Co., Ltd.',
    countries: [
      'SGP',
      'RUS',
      'DEU',
      'KOR',
      'CHN',
      'HUN',
      'POL',
      'TUR',
      'ARE',
      'BGR',
      'CHE',
      'IDN',
      'SVN',
      'HRV',
      'AUT',
      'ZAF',
      'JPN',
      'NAM',
      'KAZ',
      'NLD',
      'USA',
      'HKG',
      'ECU',
      'GBR',
      'ITA',
      'CHL',
      'BOL',
      'DOM',
      'ESP',
      'SVK',
      'VNM',
      'CZE',
      'PER',
      'IND',
      'BGD',
      'UGA',
      'NPL',
      'THA',
      'MYS',
      'QAT',
      'PAN',
      'NZL',
      'MEX',
      'MMR',
      'KHM',
      'FRA',
      'MAR',
    ],
    riskCategories: [
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'sanctions',
        label: 'Sanctions',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
      {
        id: 'sanctions_and_export_control_lists',
        label: 'Sanctions and export control lists',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory action',
      },
    ],
    riskFactors: [
      {
        id: 'sanctioned',
        label: 'Sanctioned',
      },
      {
        id: 'export_controls_adjacent',
        label: 'Related to Export Controls',
      },
      {
        id: 'sanctioned_ukr_nsdc',
        label: 'Sanctioned under Ukraine Sanctions List',
      },
      {
        id: 'psa_imports_bis_high_priority_items_critical_components',
        label:
          "Imports Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'psa_imports_bis_high_priority_items',
        label:
          "Imports Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'imports_bis_high_priority_items_critical_components',
        label:
          'Imports Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'exports_bis_high_priority_items_indirect',
        label:
          'Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_indirect',
        label:
          "Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'imports_bis_high_priority_items',
        label:
          'Imports Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        id: 'sanctioned_adjacent',
        label: 'Related to Sanctioned',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_direct',
        label:
          "Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_direct',
        label:
          "Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        id: 'meu_list_contractors',
        label: 'Procurement Activity in High-Risk Jurisdiction',
      },
      {
        id: 'psa_owned_by_chinese_soe',
        label: "Owned by Chinese State-Owned Enterprise (May Include 'PSA' Path)",
      },
      {
        id: 'owned_by_chinese_soe',
        label: 'Owned by Chinese State-Owned Enterprise',
      },
      {
        id: 'imports_from_sanctioned_ukr_nsdc_entity',
        label: 'Imports from Ukraine Sanctions List Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_direct',
        label:
          'Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_imports_from_sanctioned_ukr_nsdc_entity',
        label: "Imports from Ukraine Sanctions List Entity (May Include 'PSA' Path)",
      },
      {
        id: 'exports_bis_high_priority_items_direct',
        label:
          'Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'chinese_soe_adjacent',
        label: 'Related to Chinese State-Owned Enterprise',
      },
      {
        id: 'soe_adjacent',
        label: 'Related to State-Owned Enterprise (SOE)',
      },
      {
        id: 'export_to_soe',
        label: 'Export to State-Owned Enterprise (SOE)',
      },
      {
        id: 'psa_export_to_soe',
        label: "Export to State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
      {
        id: 'psa_forced_labor_xinjiang_origin_direct',
        label: "Direct Trade History with Xinjiang-Based Entity (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_xinjiang_origin_direct',
        label: 'Direct Trade History with Xinjiang-Based Entity',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
      },
    ],
    riskSeverity: 'critical',
  },
  {
    id: 'N9AmAR',
    label: 'Murata Manufacturing Co., Ltd.',
    countries: [
      'SGP',
      'JPN',
      'TUR',
      'THA',
      'PHL',
      'CHN',
      'GBR',
      'FRA',
      'USA',
      'FIN',
      'HKG',
      'KOR',
      'AUS',
      'VNM',
      'DEU',
      'BEL',
      'IDN',
      'NLD',
      'BRA',
      'TWN',
      'CAN',
      'ITA',
      'MYS',
      'ARE',
      'ARM',
    ],
    riskCategories: [
      {
        id: 'sanctions',
        label: 'Sanctions',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
    ],
    riskFactors: [
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'export_controls_adjacent',
        label: 'Related to Export Controls',
      },
      {
        id: 'sanctioned_adjacent',
        label: 'Related to Sanctioned',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_indirect',
        label:
          "Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
    ],
    riskSeverity: 'high',
  },
  {
    id: 'rJN4ND',
    label: 'Taiwan Semiconductor Manufacturing Company Limited',
    countries: ['CHN', 'TWN', 'FRA', 'USA', 'BEL', 'SGP', 'CAN', 'JPN', 'DEU', 'HKG', 'VGB'],
    riskCategories: [
      {
        id: 'political_exposure',
        label: 'Political exposure',
      },
      {
        id: 'adverse_media',
        label: 'Adverse media',
      },
      {
        id: 'forced_labor',
        label: 'Forced labor',
      },
      {
        id: 'export_controls',
        label: 'Export controls',
      },
    ],
    riskFactors: [
      {
        id: 'esg_score_medium',
        label: 'Medium Risk ESG Controversy Exposure Score',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
      },
      {
        id: 'pep_adjacent',
        label: 'Related to Politically Exposed Person (PEP)',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
    ],
    riskSeverity: 'high',
  },
]

export const sonyFixture = {
  projectIds: {
    sony: '0Rrdd8',
    alternate: 'YVloon',
  },
  projects: {
    projects: [
      {
        id: '0Rrdd8',
        label: 'Sony Group - Suppliers',
      },
      {
        id: 'YVloon',
        label: 'Sony Group — Sample Entity Analysis',
      },
    ],
  },
  exposure: {
    sony: {
      total: {
        count: 10,
        qualifier: 'eq',
      },
      categories: {
        sanctions: {
          count: 5,
          qualifier: 'eq',
        },
        forcedLabor: {
          count: 10,
          qualifier: 'eq',
        },
        exportControls: {
          count: 9,
          qualifier: 'eq',
        },
        adverseMedia: {
          count: 6,
          qualifier: 'eq',
        },
      },
    },
    alternate: {
      total: {
        count: 5,
        qualifier: 'eq',
      },
      categories: {
        sanctions: {
          count: 0,
          qualifier: 'eq',
        },
        forcedLabor: {
          count: 3,
          qualifier: 'eq',
        },
        exportControls: {
          count: 1,
          qualifier: 'eq',
        },
        adverseMedia: {
          count: 1,
          qualifier: 'eq',
        },
      },
    },
  },
  riskChanges: {
    from: '2026-10-19T06:16:46.115Z',
    to: '2026-10-26T06:16:46.115Z',
    changes: [
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'chinese_soe_adjacent',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Related to Chinese State-Owned Enterprise',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'export_controls_adjacent',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Related to Export Controls',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'exports_bis_high_priority_items_critical_components_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'exports_bis_high_priority_items_critical_components_indirect',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'exports_bis_high_priority_items_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'exports_bis_high_priority_items_indirect',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'export_to_soe',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Export to State-Owned Enterprise (SOE)',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'forced_labor_aspi_origin_subtier_product_blueprint',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Product-relevant Supplier Network with ASPI Entity',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Product-relevant Supplier Network with UFLPA Entity',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'forced_labor_xinjiang_origin_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Direct Trade History with Xinjiang-Based Entity',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'imports_bis_high_priority_items',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Imports Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'imports_bis_high_priority_items_critical_components',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          'Imports Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'imports_from_sanctioned_ukr_nsdc_entity',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Imports from Ukraine Sanctions List Entity',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'meu_list_contractors',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Procurement Activity in High-Risk Jurisdiction',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'owned_by_chinese_soe',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Owned by Chinese State-Owned Enterprise',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_exports_bis_high_priority_items_critical_components_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_exports_bis_high_priority_items_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Direct Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_exports_bis_high_priority_items_indirect',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Indirect Exports of Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_export_to_soe',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: "Export to State-Owned Enterprise (SOE) (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_forced_labor_xinjiang_origin_direct',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: "Direct Trade History with Xinjiang-Based Entity (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_imports_bis_high_priority_items',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Imports Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_imports_bis_high_priority_items_critical_components',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel:
          "Imports Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_imports_from_sanctioned_ukr_nsdc_entity',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: "Imports from Ukraine Sanctions List Entity (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_owned_by_chinese_soe',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: "Owned by Chinese State-Owned Enterprise (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'psa_owned_by_regulatory_action_entity',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'reputational_risk_other',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Other Reputational Risk (from Adverse Media)',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'reputational_risk_other_historic',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Other Reputational Risk (Historic)',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'sanctioned_adjacent',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Related to Sanctioned',
      },
      {
        projectEntityId: 'vdN7Ny',
        entityName: 'Samsung Electronics Co., Ltd.',
        factor: 'soe_adjacent',
        changeType: 'removed',
        timestamp: '2026-10-25T09:36:10.526Z',
        factorLabel: 'Related to State-Owned Enterprise (SOE)',
      },
    ],
    hasMore: false,
  },
  entityDetail: {
    riskFactors: [
      {
        id: 'forced_labor_aspi_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with ASPI Entity',
        level: 'high',
      },
      {
        id: 'psa_forced_labor_uflpa_origin_subtier',
        label: "Supplier Network with UFLPA Entity (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_indirect',
        label:
          'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
        level: 'high',
      },
      {
        id: 'exports_ilab_forced_labor',
        label: 'Exports Goods with ILAB Forced Labor Risk',
        level: 'elevated',
      },
      {
        id: 'psa_forced_labor_xinjiang_origin_subtier',
        label: "Supplier Network with Xinjiang-Based Entity (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'forced_labor_aspi_origin_subtier',
        label: 'Supplier Network with ASPI Entity',
        level: 'elevated',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier',
        label: 'Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
        level: 'elevated',
      },
      {
        id: 'psa_exports_ilab_child_labor',
        label: "Exports Goods with ILAB Child Labor Risk (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
        level: 'high',
      },
      {
        id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
        label: 'Product-relevant Supplier Network with UFLPA Entity',
        level: 'high',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
        label:
          "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
        level: 'high',
      },
      {
        id: 'exports_ilab_child_labor',
        label: 'Exports Goods with ILAB Child Labor Risk',
        level: 'elevated',
      },
      {
        id: 'psa_forced_labor_sheffield_hallam_university_reports_origin_subtier',
        label:
          "Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'psa_exports_ilab_forced_labor',
        label: "Exports Goods with ILAB Forced Labor Risk (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'psa_owner_of_regulatory_action_entity',
        label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
        level: 'high',
      },
      {
        id: 'forced_labor_uflpa_origin_subtier',
        label: 'Supplier Network with UFLPA Entity',
        level: 'elevated',
      },
      {
        id: 'forced_labor_xinjiang_origin_subtier',
        label: 'Supplier Network with Xinjiang-Based Entity',
        level: 'elevated',
      },
      {
        id: 'psa_forced_labor_aspi_origin_subtier',
        label: "Supplier Network with ASPI Entity (May Include 'PSA' Path)",
        level: 'elevated',
      },
      {
        id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
        label:
          'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
        level: 'high',
      },
      {
        id: 'esg_score_medium',
        label: 'Medium Risk ESG Controversy Exposure Score',
        level: 'elevated',
      },
      {
        id: 'sanctioned_adjacent',
        label: 'Related to Sanctioned',
        level: 'elevated',
      },
      {
        id: 'pep_adjacent',
        label: 'Related to Politically Exposed Person (PEP)',
        level: 'elevated',
      },
      {
        id: 'exports_bis_high_priority_items_critical_components_direct',
        label:
          'Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
        level: 'high',
      },
      {
        id: 'reputational_risk_other_historic',
        label: 'Other Reputational Risk (Historic)',
        level: 'elevated',
      },
      {
        id: 'psa_exports_bis_high_priority_items_critical_components_direct',
        label:
          "Direct Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
        level: 'high',
      },
      {
        id: 'reputational_risk_other',
        label: 'Other Reputational Risk (from Adverse Media)',
        level: 'elevated',
      },
      {
        id: 'regulatory_action',
        label: 'Regulatory Action',
        level: 'high',
      },
      {
        id: 'owned_by_regulatory_action_entity',
        label: 'Owned by Entity Subject to Regulatory Action',
        level: 'high',
      },
      {
        id: 'mass_address_usage',
        label: 'Mass Address Usage',
        level: 'elevated',
      },
      {
        id: 'psa_owned_by_regulatory_action_entity',
        label: "Owned by Entity Subject to Regulatory Action (May Include 'PSA' Path)",
        level: 'high',
      },
    ],
    riskChanges: [],
  },
  investigation: {
    projectEntityId: '34A6Aj',
    projectEntityLabel: 'SK hynix Inc.',
    resolvedEntityId: 'LND2ky2zBXWwocEd8qCL-w',
    resolvedEntityLabel: 'SK HYNIX AMERICA INC',
    initial: {
      profile: {
        id: 'LND2ky2zBXWwocEd8qCL-w',
        label: 'SK HYNIX AMERICA INC',
        type: 'company',
        countries: ['USA', 'MEX', 'JPN', 'AUS', 'SGP', 'KOR', 'CAN'],
        registrationDate: '1983-03-02',
        companyType: 'INC',
        latestStatus: 'active',
        sanctioned: false,
        pep: false,
        closed: false,
        identifiers: [
          {
            label: 'Usa Fei Number',
            value: '942876679',
          },
          {
            label: 'Lei',
            value: '549300GH2VQRUG294Y24',
          },
          {
            label: 'Unknown',
            value: '1175976',
          },
          {
            label: 'Ca Corporate Id Num',
            value: '01175976',
          },
          {
            label: 'Unknown',
            value: 'C1175976',
          },
        ],
        names: [
          'SK HYNIX AMERICA',
          'HYUNDAI ELECTRONICS AMERICA, INC.',
          'SK HYNIX AMERICA INC',
          'HYNIX SEMICONDUCTOR AMERICA INC.',
          'SK HYNIX AMERICA INC.',
          'HYNIX SEMICONDUCTOR AMERICA, INC.',
          'Hyundai Electronics America, Inc.',
          'HYUNDAI ELECTRONICS AMERICA',
        ],
        addresses: [
          '3101 NORTH FIRST STREET,BLDG A SANJOSE,CA 95134 UNITED STATES UNITEDSTATES',
          '47375 FREMONT BLVD',
          '47375 FREMONT BLVD. FREMONT 945386521',
        ],
        businessPurposes: [
          'Sale, maintenance and repair of motorcycles and related parts and accessories',
          'Other Miscellaneous Durable Goods Merchant Wholesalers',
          'Wholesale of other household goods',
          'Non-specialized wholesale trade',
          'Wholesale of other machinery and equipment',
          'Sale of motor vehicles',
          'Sale of motor vehicle parts and accessories',
          'Wholesale of construction materials, hardware, plumbing and heating equipment and supplies',
          'Automobile and Other Motor Vehicle Merchant Wholesalers',
          'WHOLESALE SEMICONDUCTOR DEVICES',
          'Distribution of Integrated Circuits Primarily DRAMs',
          'Wholesale of solid, liquid and gaseous fuels and related products',
        ],
        sources: [
          {
            label: 'South Korea Imports & Exports (January 2023 - Present)',
            count: 1533,
          },
          {
            label: 'Malaysia Imports & Exports (January 2025 - February 2026)',
            count: 639,
          },
          {
            label: 'India Imports & Exports (January 2023 - Present)',
            count: 335,
          },
          {
            label: 'Vietnam Imports & Exports (January 2019 - Present)',
            count: 224,
          },
          {
            label: 'Mexico Imports & Exports (January 2022 - Present)',
            count: 37,
          },
        ],
      },
      risks: [
        {
          id: 'exports_bis_high_priority_items_critical_components_indirect',
          label:
            'Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List',
          description:
            "The entity may have been involved, knowingly or unknowingly, in indirect exports to Russia, Belarus, or Iran through intermediate countries (2-3 hops away) of shipments with Harmonized System (HS) codes corresponding to critical U.S. components that Russia relies on for its weapons systems. These HS codes listed in Tier 1 and Tier 2 of the U.S. Bureau of Industry and Security's Common High Priority List (CHPL) are subject to the most comprehensive controls under the Export Administration Regulations (15 CFR Parts 730 – 774) (EAR). The BIS has developed the CHPL in collaboration with the European Union, Japan, and the United Kingdom.",
          level: 'high',
        },
        {
          id: 'psa_exports_bis_high_priority_items_critical_components_indirect',
          label:
            "Indirect Exports of Critical Components in USA Bureau of Industry and Security (BIS) Common High Priority Items List (May Include 'PSA' Path)",
          description:
            "The entity may have been involved, knowingly or unknowingly, in indirect exports to Russia, Belarus, or Iran through intermediate countries (2-3 hops away) of shipments with Harmonized System (HS) codes corresponding to critical U.S. components that Russia relies on for its weapons systems. These HS codes listed in Tier 1 and Tier 2 of the U.S. Bureau of Industry and Security's Common High Priority List (CHPL) are subject to the most comprehensive controls under the Export Administration Regulations (15 CFR Parts 730 – 774) (EAR). The BIS has developed the CHPL in collaboration with the European Union, Japan, and the United Kingdom. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.",
          level: 'high',
        },
        {
          id: 'psa_owner_of_regulatory_action_entity',
          label: "Owner of Entity Subject to Regulatory Action (May Include 'PSA' Path)",
          description:
            'The entity possibly owns (minority, majority, or wholly) an entity that has been listed as subject to enforcement action by regulatory authorities, law enforcement/anti-corruption agencies, or other disciplinary bodies and is up to 3 hops away via direct shareholding relationships with 10% or more controlling interest, including beneficial owner, owner, shareholder, partner, subsidiary, or branch. Applicable to entities globally. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'high',
        },
        {
          id: 'forced_labor_aspi_origin_subtier_product_blueprint',
          label: 'Product-relevant Supplier Network with ASPI Entity',
          description:
            'Historical shipment records suggest that the entity indirectly traded goods relevant to its supply chain with a third-party entity mentioned in the following forced labor report: “Uyghurs for Sale: ‘Re-education’, Forced Labor, and Surveillance beyond Xinjiang” by Australian Strategic Policy Institute. The risk was assessed using Sayari’s Product Blueprint, a proprietary methodology that traces upstream value chains to identify sub-tier supplier risks accurately across tier 2, 3, and 4 suppliers using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'high',
        },
        {
          id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier_product_blueprint',
          label:
            'Product-relevant Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
          description:
            'Historical shipment records suggest that the entity indirectly traded goods relevant to its supply chain with a third-party entity mentioned in Sheffield Hallam University’s Forced Labor Reports. The risk was assessed using Sayari’s Product Blueprint, a proprietary methodology that traces upstream value chains to identify sub-tier supplier risks accurately across tier 2, 3, and 4 suppliers using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'high',
        },
        {
          id: 'forced_labor_uflpa_origin_subtier_product_blueprint',
          label: 'Product-relevant Supplier Network with UFLPA Entity',
          description:
            'Historical shipment records suggest that the entity indirectly traded goods relevant to its supply chain with a third-party entity mentioned in the U.S. Department of Homeland Security’s “Strategy to Prevent the Importation of Goods Mined, Produced, or Manufactured with Forced Labor in the People’s Republic of China,” also known as the Uyghur Forced Labor Prevention Act (UFLPA) Entity List. The risk was assessed using Sayari’s Product Blueprint, a proprietary methodology that traces upstream value chains to identify sub-tier supplier risks accurately across tier 2, 3 and 4 suppliers using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'high',
        },
        {
          id: 'forced_labor_xinjiang_origin_subtier_product_blueprint',
          label: 'Product-relevant Supplier Network with Xinjiang-Based Entity',
          description:
            'Historical shipment records suggest that the entity indirectly traded goods relevant to its supply chain with a third-party Xinjiang-based entity. The risk was assessed using Sayari’s Product Blueprint, a proprietary methodology that traces upstream value chains to identify sub-tier supplier risks accurately across tier 2, 3, and 4 suppliers using global import & export data. The Xinjiang-based entity was assessed with geospatial and/or keyword methodology as possibly located, registered, or conducting business in Xinjiang. This risk factor only applies to trade activity within the last 730 days.',
          level: 'high',
        },
        {
          id: 'exports_ilab_child_labor',
          label: 'Exports Goods with ILAB Child Labor Risk',
          description:
            'The entity exported a shipment with an HS code and country of origin covered by the U.S. Department of Labor List of Products Produced by Child Labor.',
          level: 'elevated',
        },
        {
          id: 'psa_exports_ilab_child_labor',
          label: "Exports Goods with ILAB Child Labor Risk (May Include 'PSA' Path)",
          description:
            'The entity exported a shipment with an HS code and country of origin covered by the U.S. Department of Labor List of Products Produced by Child Labor. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'exports_ilab_forced_labor',
          label: 'Exports Goods with ILAB Forced Labor Risk',
          description:
            'The entity exported a shipment with an HS code and country of origin covered by the U.S. Department of Labor List of Products Produced by Forced Labor.',
          level: 'elevated',
        },
        {
          id: 'psa_exports_ilab_forced_labor',
          label: "Exports Goods with ILAB Forced Labor Risk (May Include 'PSA' Path)",
          description:
            'The entity exported a shipment with an HS code and country of origin covered by the U.S. Department of Labor List of Products Produced by Forced Labor. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'forced_labor_aspi_origin_subtier',
          label: 'Supplier Network with ASPI Entity',
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in the following forced labor report: “Uyghurs for Sale: ‘Re-education’, Forced Labor, and Surveillance beyond Xinjiang” by Australian Strategic Policy Institute, that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'elevated',
        },
        {
          id: 'psa_forced_labor_aspi_origin_subtier',
          label: "Supplier Network with ASPI Entity (May Include 'PSA' Path)",
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in the following forced labor report: “Uyghurs for Sale: ‘Re-education’, Forced Labor, and Surveillance beyond Xinjiang” by Australian Strategic Policy Institute, that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'forced_labor_sheffield_hallam_university_reports_origin_subtier',
          label:
            'Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports',
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in Sheffield Hallam University Forced Labor Reports that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'elevated',
        },
        {
          id: 'psa_forced_labor_sheffield_hallam_university_reports_origin_subtier',
          label:
            "Supplier Network with Entity from Sheffield Hallam University Forced Labor Reports (May Include 'PSA' Path)",
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in Sheffield Hallam University Forced Labor Reports that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'forced_labor_uflpa_origin_subtier',
          label: 'Supplier Network with UFLPA Entity',
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in the U.S. Department of Homeland Security’s “Strategy to Prevent the Importation of Goods Mined, Produced, or Manufactured with Forced Labor in the People’s Republic of China,” also known as the Uyghur Forced Labor Prevention Act (UFLPA) Entity List, that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days.',
          level: 'elevated',
        },
        {
          id: 'psa_forced_labor_uflpa_origin_subtier',
          label: "Supplier Network with UFLPA Entity (May Include 'PSA' Path)",
          description:
            'Historical shipment records suggest that the entity has a third-party entity mentioned in the U.S. Department of Homeland Security’s “Strategy to Prevent the Importation of Goods Mined, Produced, or Manufactured with Forced Labor in the People’s Republic of China,” also known as the Uyghur Forced Labor Prevention Act (UFLPA) Entity List, that was identified in tier 2 or 3 of their supplier network using global import & export data. This risk factor only applies to trade activity within the last 730 days. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'forced_labor_xinjiang_origin_subtier',
          label: 'Supplier Network with Xinjiang-Based Entity',
          description:
            'Historical shipment records suggest that the entity has a third-party Xinjiang-based entity that was identified in tier 2 or 3 of their supplier network using global import & export data. The Xinjiang-based entity was assessed with geospatial and/or keyword methodology as possibly located, registered, or conducting business in Xinjiang. This risk factor only applies to trade activity within the last 730 days.',
          level: 'elevated',
        },
        {
          id: 'psa_forced_labor_xinjiang_origin_subtier',
          label: "Supplier Network with Xinjiang-Based Entity (May Include 'PSA' Path)",
          description:
            'Historical shipment records suggest that the entity has a third-party Xinjiang-based entity that was identified in tier 2 or 3 of their supplier network using global import & export data. The Xinjiang-based entity was assessed with geospatial and/or keyword methodology as possibly located, registered, or conducting business in Xinjiang. This risk factor only applies to trade activity within the last 730 days. This network risk path may include ‘Possibly the Same As’ (PSA) relationships—links between companies or persons that have closely matching attributes across datasets, but do not have enough shared information to definitively establish they are the same entity.',
          level: 'elevated',
        },
        {
          id: 'basel_aml',
          label: 'Basel AML Index',
          description:
            'The Basel Anti-Money Laundering (AML) Index is an annual ranking that assesses the risk of money laundering and terrorist financing around the world and is maintained by the Basel Institute on Governance. The ranking displayed here ranks jurisdictions on a scale of 0 (lowest risk) to 10 (highest risk).',
          level: 'relevant',
        },
        {
          id: 'cpi_score',
          label: 'Corruption Perceptions Index',
          description:
            'The Corruption Perceptions Index (CPI) is published yearly by Transparency International and ranks 180 countries and territories around the world by their perceived levels of public sector corruption. The results are given on a scale of 0 (highly corrupt) to 100 (very clean). If the entity is referenced with multiple countries, the country with the highest score will be used.',
          level: 'relevant',
        },
      ],
      relationships: [
        {
          id: 'zm9b8xwiHFxOEgXYB3kFjQ',
          label: 'HONG CHEOL (SCOTT) KIM',
          countries: ['USA'],
          types: ['Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'ylTOgfxv-4inFmkA4xYImg',
          label: 'SMART MODULAR TECHNOLOGIES MALAYSIA SDN BHD',
          countries: [],
          types: ['Ships To'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'yOYransrI64ZHxJWSYW_dQ',
          label: 'RAMPAC',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'yJumyQh5jUNw0OiPFRW-xw',
          label: 'S.K. KANG',
          countries: ['USA'],
          types: ['Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'yGNL7fhkX0lN7QqRKATvZw',
          label: 'Yoo-Soo Ho',
          countries: ['USA'],
          types: ['Has Beneficial Owner', 'Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'y9r4CCLp4nbZH15Irk5PqA',
          label: 'Paul Fahey',
          countries: ['USA'],
          types: ['Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'wJBk3XFH8Ry4WtipBzraww',
          label: '1ST SOURCE - 2ND SOURCE - ALL THE MEMORY YOU NEED',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'wGmkrj9bm_9n7nxrSMGl5A',
          label: 'AXILVISION',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'wDFUKQzMKptE9fwOPSbudw',
          label: 'GULLIVER',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'urspCQESqclfYlrVErrpxg',
          label: 'JOHN A HUGHES TOWNSEND AND TOWNSEND AND CREW LLP',
          countries: ['USA'],
          types: ['Has Lawyer'],
          sanctioned: false,
          pep: false,
        },
      ],
      relationshipCount: 2883,
      nextRelationship: 'furspCQESqclfYlrVErrpxg',
      records: [
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1775001600000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2026-04-01',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1772323200000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2026-03-01',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1769904000000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2026-02-01',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1767225600000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2026-01-01',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1764547200000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2025-12-01',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1763942400000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2025-11-24',
        },
        {
          id: '5b1375783448347064745954e331bbe9/7be72590-3819-4151-b1d7-55ae7535cf13/1762992000000',
          label:
            'Risk Intelligence Record from SESAMm ESG Controversy Exposure Scores (3rd Party Data)',
          type: 'about',
          acquisitionDate: '2025-11-13',
        },
        {
          id: '701bbfc53dd09fad95b177d1f07f3667/f376bddf-0df0-537b-8115-424f1c4c735d/1764028800000',
          label: 'SK hynix America Inc. Cuts 91 Jobs in California',
          type: 'about',
          publicationDate: '2025-08-04',
          acquisitionDate: '2025-11-25',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1790812800000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-10-01',
          acquisitionDate: '2026-10-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1789430400000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-09-15',
          acquisitionDate: '2026-09-15',
        },
      ],
      recordCount: 3001,
      nextRecord:
        'WFhYfGdsZWlmfHR8MjAyNi0wOS0xNXw1NDkzMDBHSDJWUVJVRzI5NFkyNC40YjU1OGIwNDYyYjRjY2JhMzY3NGFhMWM5MWZmMjYyOHwxNzg5NDMwNDAwMDAw',
    },
    moreRelationships: {
      relationships: [
        {
          id: 'u0F6CyTcxL_NKeq-FvRtzw',
          label: 'NORTHBRIDGE',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'tiZBceO2O3Bl2OqNnL192w',
          label: 'JOHN A HUGHES TOWNSEND AND TOWNSEND AND CREW',
          countries: ['USA'],
          types: ['Has Lawyer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'sd3Glus-03qdmovJrdA7Cw',
          label: 'Hee Jin Chung',
          countries: ['USA'],
          types: ['Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'sVblemyuqnZ9hjq5ImDKOA',
          label: 'CORPORATION SERVICE COMPANY',
          countries: ['USA'],
          types: ['Has Registered Agent'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'sKQP_uj6J-81pJ7mCY0SMg',
          label: 'Maxtor Corporation',
          countries: ['USA'],
          types: ['Beneficial Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'oTxpuDXn_pM8py_crXO7ZQ',
          label: 'SUNGSOO RYU',
          countries: ['USA'],
          types: ['Has Beneficial Owner', 'Has Director', 'Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'nue-ip7ocjxwRWlzbhGYIg',
          label: 'TYMPHANY ACOUSTIC TECHNOLOGY (THAILAND) CO.,LTD',
          countries: ['THA', 'KOR'],
          types: ['Ships To'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'neZv419DpbX9UBsW12D8jA',
          label: 'SAVI',
          countries: ['USA'],
          types: ['Owner Of'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'n1sW6F7RM9QsqrGioYhe5w',
          label: 'IN JAE KIM',
          countries: ['USA'],
          types: ['Has Officer'],
          sanctioned: false,
          pep: false,
        },
        {
          id: 'lNq7QpF2pwR_sTpWfSeGhg',
          label: 'NATIONAL REGISTERED AGENTS, INC.',
          countries: ['USA'],
          types: ['Has Registered Agent'],
          sanctioned: false,
          pep: false,
        },
      ],
      relationshipCount: 2883,
      nextRelationship: 'flNq7QpF2pwR_sTpWfSeGhg',
    },
    moreRecords: {
      records: [
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1788220800000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-09-01',
          acquisitionDate: '2026-09-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1786752000000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-08-15',
          acquisitionDate: '2026-08-15',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1785542400000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-08-01',
          acquisitionDate: '2026-08-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1784073600000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-07-15',
          acquisitionDate: '2026-07-15',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1782864000000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-07-01',
          acquisitionDate: '2026-07-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1781481600000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-06-15',
          acquisitionDate: '2026-06-15',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1780272000000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-06-01',
          acquisitionDate: '2026-06-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1778803200000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-05-15',
          acquisitionDate: '2026-05-15',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1777593600000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-05-01',
          acquisitionDate: '2026-05-01',
        },
        {
          id: 'b812677c0a32a1746b3ac741c7b97ae0/549300GH2VQRUG294Y24.4b558b0462b4ccba3674aa1c91ff2628/1775001600000',
          label: 'Company Record from Legal Entity Identifier (LEI) Registry (3rd Party Data)',
          type: 'about',
          publicationDate: '2026-04-01',
          acquisitionDate: '2026-04-01',
        },
      ],
      recordCount: 3001,
      nextRecord:
        'WFhYfGdsZWlmfHR8MjAyNi0wNC0wMXw1NDkzMDBHSDJWUVJVRzI5NFkyNC40YjU1OGIwNDYyYjRjY2JhMzY3NGFhMWM5MWZmMjYyOHwxNzc1MDAxNjAwMDAw',
    },
  },
  entities: {
    initial: { entities: projectEntities },
    byName: {
      entities: projectEntities.filter(({ label }) => label.toLowerCase().includes('sk hynix')),
    },
    byCountry: { entities: projectEntities.filter(({ countries }) => countries.includes('JPN')) },
  },
}
