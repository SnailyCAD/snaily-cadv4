-- Seed data for SnailyCAD v4
-- User: cmlzbadjt0000scde6bat9cip
-- CAD:  cmlzbadjx0001scdefsp5pluv

BEGIN;

-- ============================================
-- 1. VALUES (lookup data)
-- ============================================

-- GENDER
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_gender_male', 'GENDER', 'Male', true, 0),
('val_gender_female', 'GENDER', 'Female', false, 1),
('val_gender_nb', 'GENDER', 'Non-Binary', false, 2);

-- ETHNICITY
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_eth_white', 'ETHNICITY', 'White', true, 0),
('val_eth_black', 'ETHNICITY', 'Black', false, 1),
('val_eth_hispanic', 'ETHNICITY', 'Hispanic', false, 2),
('val_eth_asian', 'ETHNICITY', 'Asian', false, 3),
('val_eth_other', 'ETHNICITY', 'Other', false, 4);

-- LICENSE
INSERT INTO "Value" (id, type, value, "isDefault", position, "licenseType") VALUES
('val_lic_valid', 'LICENSE', 'Valid', true, 0, 'LICENSE'),
('val_lic_suspended', 'LICENSE', 'Suspended', false, 1, 'LICENSE'),
('val_lic_revoked', 'LICENSE', 'Revoked', false, 2, 'LICENSE'),
('val_lic_expired', 'LICENSE', 'Expired', false, 3, 'LICENSE'),
('val_reg_registered', 'LICENSE', 'Registered', true, 4, 'REGISTRATION_STATUS'),
('val_reg_unregistered', 'LICENSE', 'Unregistered', false, 5, 'REGISTRATION_STATUS'),
('val_ins_insured', 'LICENSE', 'Insured', true, 6, 'INSURANCE_STATUS'),
('val_ins_uninsured', 'LICENSE', 'Uninsured', false, 7, 'INSURANCE_STATUS');

-- BLOOD_GROUP
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_bg_apos', 'BLOOD_GROUP', 'A+', false, 0),
('val_bg_aneg', 'BLOOD_GROUP', 'A-', false, 1),
('val_bg_bpos', 'BLOOD_GROUP', 'B+', false, 2),
('val_bg_bneg', 'BLOOD_GROUP', 'B-', false, 3),
('val_bg_abpos', 'BLOOD_GROUP', 'AB+', false, 4),
('val_bg_abneg', 'BLOOD_GROUP', 'AB-', false, 5),
('val_bg_opos', 'BLOOD_GROUP', 'O+', true, 6),
('val_bg_oneg', 'BLOOD_GROUP', 'O-', false, 7);

-- DEPARTMENT
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_dept_lspd', 'DEPARTMENT', 'Los Santos Police Department', true, 0),
('val_dept_bcso', 'DEPARTMENT', 'Blaine County Sheriff Office', false, 1),
('val_dept_sahp', 'DEPARTMENT', 'San Andreas Highway Patrol', false, 2),
('val_dept_lsfd', 'DEPARTMENT', 'Los Santos Fire Department', false, 3),
('val_dept_ems', 'DEPARTMENT', 'Emergency Medical Services', false, 4);

INSERT INTO "DepartmentValue" (id, "valueId", type, callsign, "isDefaultDepartment") VALUES
('dv_lspd', 'val_dept_lspd', 'LEO', 'L', true),
('dv_bcso', 'val_dept_bcso', 'LEO', 'B', false),
('dv_sahp', 'val_dept_sahp', 'LEO', 'H', false),
('dv_lsfd', 'val_dept_lsfd', 'EMS_FD', 'F', true),
('dv_ems', 'val_dept_ems', 'EMS_FD', 'E', false);

-- DIVISION
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_div_patrol', 'DIVISION', 'Patrol Division', true, 0),
('val_div_detective', 'DIVISION', 'Detective Division', false, 1),
('val_div_swat', 'DIVISION', 'SWAT', false, 2),
('val_div_traffic', 'DIVISION', 'Traffic Division', false, 3),
('val_div_k9', 'DIVISION', 'K-9 Unit', false, 4),
('val_div_rescue', 'DIVISION', 'Rescue Division', false, 5),
('val_div_hazmat', 'DIVISION', 'HAZMAT Division', false, 6);

INSERT INTO "DivisionValue" (id, "valueId", "departmentId", callsign) VALUES
('divv_patrol', 'val_div_patrol', 'dv_lspd', 'P'),
('divv_detective', 'val_div_detective', 'dv_lspd', 'D'),
('divv_swat', 'val_div_swat', 'dv_lspd', 'S'),
('divv_traffic', 'val_div_traffic', 'dv_sahp', 'T'),
('divv_k9', 'val_div_k9', 'dv_bcso', 'K'),
('divv_rescue', 'val_div_rescue', 'dv_lsfd', 'R'),
('divv_hazmat', 'val_div_hazmat', 'dv_lsfd', 'H');

-- OFFICER_RANK
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_rank_chief', 'OFFICER_RANK', 'Chief', false, 0),
('val_rank_captain', 'OFFICER_RANK', 'Captain', false, 1),
('val_rank_lieutenant', 'OFFICER_RANK', 'Lieutenant', false, 2),
('val_rank_sergeant', 'OFFICER_RANK', 'Sergeant', false, 3),
('val_rank_corporal', 'OFFICER_RANK', 'Corporal', false, 4),
('val_rank_officer', 'OFFICER_RANK', 'Officer', true, 5),
('val_rank_deputy', 'OFFICER_RANK', 'Deputy', false, 6),
('val_rank_trooper', 'OFFICER_RANK', 'Trooper', false, 7);

-- VEHICLE
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_veh_crown', 'VEHICLE', 'Ford Crown Victoria', false, 0),
('val_veh_charger', 'VEHICLE', 'Dodge Charger', false, 1),
('val_veh_mustang', 'VEHICLE', 'Ford Mustang', false, 2),
('val_veh_camaro', 'VEHICLE', 'Chevrolet Camaro', false, 3),
('val_veh_civic', 'VEHICLE', 'Honda Civic', false, 4),
('val_veh_corolla', 'VEHICLE', 'Toyota Corolla', false, 5),
('val_veh_f150', 'VEHICLE', 'Ford F-150', false, 6),
('val_veh_silverado', 'VEHICLE', 'Chevrolet Silverado', false, 7),
('val_veh_tesla3', 'VEHICLE', 'Tesla Model 3', false, 8),
('val_veh_bmw3', 'VEHICLE', 'BMW 3 Series', false, 9),
('val_veh_explorer', 'VEHICLE', 'Ford Explorer', false, 10),
('val_veh_tahoe', 'VEHICLE', 'Chevrolet Tahoe', false, 11);

INSERT INTO "VehicleValue" (id, "valueId") VALUES
('vv_crown', 'val_veh_crown'),
('vv_charger', 'val_veh_charger'),
('vv_mustang', 'val_veh_mustang'),
('vv_camaro', 'val_veh_camaro'),
('vv_civic', 'val_veh_civic'),
('vv_corolla', 'val_veh_corolla'),
('vv_f150', 'val_veh_f150'),
('vv_silverado', 'val_veh_silverado'),
('vv_tesla3', 'val_veh_tesla3'),
('vv_bmw3', 'val_veh_bmw3'),
('vv_explorer', 'val_veh_explorer'),
('vv_tahoe', 'val_veh_tahoe');

-- WEAPON
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_wpn_glock17', 'WEAPON', 'Glock 17', false, 0),
('val_wpn_m1911', 'WEAPON', 'Colt M1911', false, 1),
('val_wpn_ar15', 'WEAPON', 'AR-15', false, 2),
('val_wpn_remington870', 'WEAPON', 'Remington 870', false, 3),
('val_wpn_sig226', 'WEAPON', 'SIG Sauer P226', false, 4),
('val_wpn_mp5', 'WEAPON', 'H&K MP5', false, 5);

INSERT INTO "WeaponValue" (id, "valueId") VALUES
('wv_glock17', 'val_wpn_glock17'),
('wv_m1911', 'val_wpn_m1911'),
('wv_ar15', 'val_wpn_ar15'),
('wv_remington870', 'val_wpn_remington870'),
('wv_sig226', 'val_wpn_sig226'),
('wv_mp5', 'val_wpn_mp5');

-- CODES_10 (status codes)
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_code_10_8', 'CODES_10', '10-8 (On Duty)', true, 0),
('val_code_10_7', 'CODES_10', '10-7 (Off Duty)', false, 1),
('val_code_10_6', 'CODES_10', '10-6 (Busy)', false, 2),
('val_code_10_11', 'CODES_10', '10-11 (Traffic Stop)', false, 3),
('val_code_10_15', 'CODES_10', '10-15 (Subject in Custody)', false, 4),
('val_code_10_23', 'CODES_10', '10-23 (Arrived on Scene)', false, 5),
('val_code_10_97', 'CODES_10', '10-97 (En Route)', false, 6),
('val_code_10_99', 'CODES_10', '10-99 (Panic)', false, 7),
('val_code_sc_stab', 'CODES_10', 'Code 1 (Stabbing)', false, 8),
('val_code_sc_shoot', 'CODES_10', 'Code 2 (Shooting)', false, 9),
('val_code_sc_pursuit', 'CODES_10', 'Code 3 (Pursuit)', false, 10);

INSERT INTO "StatusValue" (id, "valueId", "shouldDo", "whatPages", color, type) VALUES
('sv_10_8', 'val_code_10_8', 'SET_ON_DUTY', '{LEO,EMS_FD,DISPATCH}', '#3fc26b', 'STATUS_CODE'),
('sv_10_7', 'val_code_10_7', 'SET_OFF_DUTY', '{LEO,EMS_FD,DISPATCH}', '#c23f3f', 'STATUS_CODE'),
('sv_10_6', 'val_code_10_6', 'SET_STATUS', '{LEO,EMS_FD}', '#f0ad4e', 'STATUS_CODE'),
('sv_10_11', 'val_code_10_11', 'SET_STATUS', '{LEO}', '#5bc0de', 'STATUS_CODE'),
('sv_10_15', 'val_code_10_15', 'SET_STATUS', '{LEO}', '#0275d8', 'STATUS_CODE'),
('sv_10_23', 'val_code_10_23', 'ON_SCENE', '{LEO,EMS_FD}', '#22b14c', 'STATUS_CODE'),
('sv_10_97', 'val_code_10_97', 'EN_ROUTE', '{LEO,EMS_FD}', '#ffbf00', 'STATUS_CODE'),
('sv_10_99', 'val_code_10_99', 'PANIC_BUTTON', '{LEO,EMS_FD}', '#ff0000', 'STATUS_CODE'),
('sv_sc_stab', 'val_code_sc_stab', 'SET_STATUS', '{DISPATCH}', '#ff6600', 'SITUATION_CODE'),
('sv_sc_shoot', 'val_code_sc_shoot', 'SET_STATUS', '{DISPATCH}', '#ff0000', 'SITUATION_CODE'),
('sv_sc_pursuit', 'val_code_sc_pursuit', 'SET_STATUS', '{DISPATCH}', '#cc0000', 'SITUATION_CODE');

-- CALL_TYPE
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_ct_traffic', 'CALL_TYPE', 'Traffic Stop', true, 0),
('val_ct_domestic', 'CALL_TYPE', 'Domestic Disturbance', false, 1),
('val_ct_robbery', 'CALL_TYPE', 'Robbery', false, 2),
('val_ct_assault', 'CALL_TYPE', 'Assault', false, 3),
('val_ct_shots', 'CALL_TYPE', 'Shots Fired', false, 4),
('val_ct_pursuit', 'CALL_TYPE', 'Vehicle Pursuit', false, 5),
('val_ct_suspicious', 'CALL_TYPE', 'Suspicious Activity', false, 6),
('val_ct_medical', 'CALL_TYPE', 'Medical Emergency', false, 7),
('val_ct_fire', 'CALL_TYPE', 'Structure Fire', false, 8),
('val_ct_accident', 'CALL_TYPE', 'Traffic Accident', false, 9);

INSERT INTO "CallTypeValue" (id, "valueId", priority) VALUES
('ctv_traffic', 'val_ct_traffic', '3'),
('ctv_domestic', 'val_ct_domestic', '2'),
('ctv_robbery', 'val_ct_robbery', '1'),
('ctv_assault', 'val_ct_assault', '1'),
('ctv_shots', 'val_ct_shots', '1'),
('ctv_pursuit', 'val_ct_pursuit', '1'),
('ctv_suspicious', 'val_ct_suspicious', '3'),
('ctv_medical', 'val_ct_medical', '1'),
('ctv_fire', 'val_ct_fire', '1'),
('ctv_accident', 'val_ct_accident', '2');

-- IMPOUND_LOT
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_imp_city', 'IMPOUND_LOT', 'City Impound Lot', true, 0),
('val_imp_county', 'IMPOUND_LOT', 'County Impound Yard', false, 1);

-- CITIZEN_FLAG
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_cf_violent', 'CITIZEN_FLAG', 'Violent', false, 0),
('val_cf_felon', 'CITIZEN_FLAG', 'Convicted Felon', false, 1),
('val_cf_mental', 'CITIZEN_FLAG', 'Mental Health Issues', false, 2),
('val_cf_gang', 'CITIZEN_FLAG', 'Gang Affiliated', false, 3);

-- VEHICLE_FLAG
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_vf_stolen', 'VEHICLE_FLAG', 'Stolen', false, 0),
('val_vf_wanted', 'VEHICLE_FLAG', 'Wanted', false, 1),
('val_vf_seized', 'VEHICLE_FLAG', 'Seized', false, 2);

-- WEAPON_FLAG
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_wf_stolen', 'WEAPON_FLAG', 'Stolen', false, 0),
('val_wf_evidence', 'WEAPON_FLAG', 'Evidence', false, 1);

-- ADDRESS
INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_addr_grove', 'ADDRESS', 'Grove Street', false, 0),
('val_addr_vinewood', 'ADDRESS', 'Vinewood Boulevard', false, 1),
('val_addr_alta', 'ADDRESS', 'Alta Street', false, 2),
('val_addr_elgin', 'ADDRESS', 'Elgin Avenue', false, 3),
('val_addr_strawberry', 'ADDRESS', 'Strawberry Avenue', false, 4);

INSERT INTO "AddressValue" (id, "valueId", county, postal) VALUES
(gen_random_uuid()::text, 'val_addr_grove', 'Los Santos', '001'),
(gen_random_uuid()::text, 'val_addr_vinewood', 'Los Santos', '042'),
(gen_random_uuid()::text, 'val_addr_alta', 'Los Santos', '033'),
(gen_random_uuid()::text, 'val_addr_elgin', 'Los Santos', '055'),
(gen_random_uuid()::text, 'val_addr_strawberry', 'Los Santos', '012');

-- ============================================
-- 2. CITIZENS
-- ============================================

INSERT INTO "Citizen" (id, "userId", name, surname, "dateOfBirth", "genderId", "ethnicityId", "hairColor", "eyeColor", address, postal, height, weight, "driversLicenseId", "weaponLicenseId", "pilotLicenseId", occupation, "phoneNumber") VALUES
('cit_john_doe', 'cmlzbadjt0000scde6bat9cip', 'John', 'Doe', '1985-03-15', 'val_gender_male', 'val_eth_white', 'Brown', 'Blue', '1234 Grove Street', '001', '180', '82', 'val_lic_valid', 'val_lic_valid', NULL, 'Mechanic', '555-0101'),
('cit_jane_smith', 'cmlzbadjt0000scde6bat9cip', 'Jane', 'Smith', '1990-07-22', 'val_gender_female', 'val_eth_hispanic', 'Black', 'Brown', '567 Vinewood Blvd', '042', '165', '60', 'val_lic_valid', NULL, 'val_lic_valid', 'Pilot', '555-0102'),
('cit_marcus_johnson', 'cmlzbadjt0000scde6bat9cip', 'Marcus', 'Johnson', '1978-11-30', 'val_gender_male', 'val_eth_black', 'Black', 'Brown', '890 Alta Street', '033', '188', '95', 'val_lic_valid', 'val_lic_valid', NULL, 'Police Officer', '555-0103'),
('cit_sarah_williams', 'cmlzbadjt0000scde6bat9cip', 'Sarah', 'Williams', '1995-01-10', 'val_gender_female', 'val_eth_white', 'Blonde', 'Green', '234 Elgin Ave', '055', '170', '58', 'val_lic_valid', NULL, NULL, 'Nurse', '555-0104'),
('cit_david_lee', 'cmlzbadjt0000scde6bat9cip', 'David', 'Lee', '1988-06-05', 'val_gender_male', 'val_eth_asian', 'Black', 'Brown', '456 Strawberry Ave', '012', '175', '73', 'val_lic_suspended', NULL, NULL, 'Taxi Driver', '555-0105'),
('cit_emily_chen', 'cmlzbadjt0000scde6bat9cip', 'Emily', 'Chen', '1992-09-18', 'val_gender_female', 'val_eth_asian', 'Black', 'Brown', '789 Grove Street', '001', '160', '52', 'val_lic_valid', 'val_lic_valid', NULL, 'Business Owner', '555-0106'),
('cit_carlos_garcia', 'cmlzbadjt0000scde6bat9cip', 'Carlos', 'Garcia', '1982-12-01', 'val_gender_male', 'val_eth_hispanic', 'Brown', 'Hazel', '321 Vinewood Blvd', '042', '178', '85', 'val_lic_revoked', NULL, NULL, 'Unemployed', '555-0107'),
('cit_rachel_taylor', 'cmlzbadjt0000scde6bat9cip', 'Rachel', 'Taylor', '1998-04-25', 'val_gender_female', 'val_eth_white', 'Red', 'Blue', '654 Alta Street', '033', '168', '55', 'val_lic_valid', NULL, NULL, 'Paramedic', '555-0108'),
('cit_mike_brown', 'cmlzbadjt0000scde6bat9cip', 'Mike', 'Brown', '1975-08-14', 'val_gender_male', 'val_eth_white', 'Gray', 'Brown', '987 Elgin Ave', '055', '185', '90', 'val_lic_valid', 'val_lic_valid', 'val_lic_valid', 'Fire Chief', '555-0109'),
('cit_alex_rivera', 'cmlzbadjt0000scde6bat9cip', 'Alex', 'Rivera', '2000-02-28', 'val_gender_nb', 'val_eth_hispanic', 'Brown', 'Green', '111 Strawberry Ave', '012', '172', '65', 'val_lic_valid', NULL, NULL, 'Student', '555-0110');

-- ============================================
-- 3. REGISTERED VEHICLES
-- ============================================

INSERT INTO "RegisteredVehicle" (id, "userId", "citizenId", "vinNumber", plate, "modelId", color, "registrationStatusId", "insuranceStatusId", "inspectionStatus", "taxStatus") VALUES
('rv_john_crown', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'VIN00000001', 'LSP 001', 'vv_crown', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_john_f150', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'VIN00000002', 'LSP 002', 'vv_f150', 'Black', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_jane_mustang', 'cmlzbadjt0000scde6bat9cip', 'cit_jane_smith', 'VIN00000003', 'AIR 420', 'vv_mustang', 'Red', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_marcus_charger', 'cmlzbadjt0000scde6bat9cip', 'cit_marcus_johnson', 'VIN00000004', 'COP 101', 'vv_charger', 'Black', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_sarah_civic', 'cmlzbadjt0000scde6bat9cip', 'cit_sarah_williams', 'VIN00000005', 'MED 001', 'vv_civic', 'Silver', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_david_corolla', 'cmlzbadjt0000scde6bat9cip', 'cit_david_lee', 'VIN00000006', 'TAX 999', 'vv_corolla', 'Yellow', 'val_reg_registered', 'val_ins_uninsured', 'FAILED', 'UNTAXED'),
('rv_emily_tesla', 'cmlzbadjt0000scde6bat9cip', 'cit_emily_chen', 'VIN00000007', 'ECO 123', 'vv_tesla3', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_carlos_camaro', 'cmlzbadjt0000scde6bat9cip', 'cit_carlos_garcia', 'VIN00000008', 'FAS 777', 'vv_camaro', 'Orange', 'val_reg_unregistered', 'val_ins_uninsured', NULL, 'UNTAXED'),
('rv_rachel_explorer', 'cmlzbadjt0000scde6bat9cip', 'cit_rachel_taylor', 'VIN00000009', 'EMS 202', 'vv_explorer', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_mike_tahoe', 'cmlzbadjt0000scde6bat9cip', 'cit_mike_brown', 'VIN00000010', 'FIR 911', 'vv_tahoe', 'Red', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_alex_bmw', 'cmlzbadjt0000scde6bat9cip', 'cit_alex_rivera', 'VIN00000011', 'STU 420', 'vv_bmw3', 'Blue', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_john_silverado', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'VIN00000012', 'BIG 350', 'vv_silverado', 'Gray', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED');

UPDATE "RegisteredVehicle" SET "reportedStolen" = true WHERE id = 'rv_carlos_camaro';

-- ============================================
-- 4. WEAPONS
-- ============================================

INSERT INTO "Weapon" (id, "userId", "citizenId", "serialNumber", "registrationStatusId", "modelId") VALUES
('wp_john_glock', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'SN-GLK-00001', 'val_reg_registered', 'wv_glock17'),
('wp_john_ar15', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'SN-AR15-00001', 'val_reg_registered', 'wv_ar15'),
('wp_marcus_sig', 'cmlzbadjt0000scde6bat9cip', 'cit_marcus_johnson', 'SN-SIG-00001', 'val_reg_registered', 'wv_sig226'),
('wp_marcus_870', 'cmlzbadjt0000scde6bat9cip', 'cit_marcus_johnson', 'SN-REM-00001', 'val_reg_registered', 'wv_remington870'),
('wp_emily_glock', 'cmlzbadjt0000scde6bat9cip', 'cit_emily_chen', 'SN-GLK-00002', 'val_reg_registered', 'wv_glock17'),
('wp_mike_m1911', 'cmlzbadjt0000scde6bat9cip', 'cit_mike_brown', 'SN-1911-00001', 'val_reg_registered', 'wv_m1911');

-- ============================================
-- 5. OFFICERS (LEO)
-- ============================================

INSERT INTO "Officer" (id, "departmentId", callsign, callsign2, "citizenId", "userId", "rankId", "badgeNumber") VALUES
('off_marcus_lspd', 'dv_lspd', '1', '41', 'cit_marcus_johnson', 'cmlzbadjt0000scde6bat9cip', 'val_rank_sergeant', 141),
('off_john_lspd', 'dv_lspd', '1', '55', 'cit_john_doe', 'cmlzbadjt0000scde6bat9cip', 'val_rank_officer', 155),
('off_sarah_bcso', 'dv_bcso', '2', '12', 'cit_sarah_williams', 'cmlzbadjt0000scde6bat9cip', 'val_rank_corporal', 212),
('off_mike_sahp', 'dv_sahp', '3', '01', 'cit_mike_brown', 'cmlzbadjt0000scde6bat9cip', 'val_rank_lieutenant', 301);

-- Link officers to divisions (A = DivisionValue, B = Officer)
INSERT INTO "_officerDivisionsToDivision" ("A", "B") VALUES
('divv_patrol', 'off_marcus_lspd'),
('divv_detective', 'off_marcus_lspd'),
('divv_patrol', 'off_john_lspd'),
('divv_k9', 'off_sarah_bcso'),
('divv_traffic', 'off_mike_sahp');

-- ============================================
-- 6. EMS/FD DEPUTIES
-- ============================================

INSERT INTO "EmsFdDeputy" (id, "departmentId", callsign, callsign2, "citizenId", "userId", "rankId", "badgeNumber") VALUES
('ems_rachel', 'dv_ems', 'E', '01', 'cit_rachel_taylor', 'cmlzbadjt0000scde6bat9cip', 'val_rank_officer', 501),
('ems_sarah', 'dv_lsfd', 'F', '02', 'cit_sarah_williams', 'cmlzbadjt0000scde6bat9cip', 'val_rank_corporal', 502);

-- ============================================
-- 7. MEDICAL RECORDS
-- ============================================

INSERT INTO "MedicalRecord" (id, "userId", "citizenId", type, description, "bloodGroupId") VALUES
('mr_john_1', 'cmlzbadjt0000scde6bat9cip', 'cit_john_doe', 'Asthma', 'Mild asthma, uses inhaler as needed', 'val_bg_opos'),
('mr_jane_1', 'cmlzbadjt0000scde6bat9cip', 'cit_jane_smith', 'Diabetes Type 2', 'Manages with medication and diet', 'val_bg_apos'),
('mr_carlos_1', 'cmlzbadjt0000scde6bat9cip', 'cit_carlos_garcia', 'Gunshot Wound', 'GSW to left shoulder, treated at Pillbox Medical', 'val_bg_bpos'),
('mr_david_1', 'cmlzbadjt0000scde6bat9cip', 'cit_david_lee', 'Broken Arm', 'Right arm fracture from vehicle accident', 'val_bg_abneg'),
('mr_alex_1', 'cmlzbadjt0000scde6bat9cip', 'cit_alex_rivera', 'Allergies', 'Severe peanut allergy - carries EpiPen', 'val_bg_oneg');

-- ============================================
-- 8. PENAL CODES
-- ============================================

INSERT INTO "PenalCodeGroup" (id, name, position) VALUES
('pcg_traffic', 'Traffic Violations', 0),
('pcg_misdemeanor', 'Misdemeanors', 1),
('pcg_felony', 'Felonies', 2);

INSERT INTO "WarningApplicable" (id, fines) VALUES
('wa_traffic_1', '{150, 500}'),
('wa_traffic_2', '{250, 750}'),
('wa_traffic_3', '{500, 1500}');

INSERT INTO "WarningNotApplicable" (id, fines, "prisonTerm", bail) VALUES
('wna_mis_1', '{500, 2000}', '{5, 15}', '{1000, 5000}'),
('wna_mis_2', '{1000, 5000}', '{10, 30}', '{2500, 10000}'),
('wna_fel_1', '{5000, 25000}', '{30, 120}', '{10000, 50000}'),
('wna_fel_2', '{10000, 50000}', '{60, 240}', '{25000, 100000}'),
('wna_fel_3', '{25000, 100000}', '{120, 999}', '{50000, 250000}');

-- Traffic infractions (warning applicable)
INSERT INTO "PenalCode" (id, title, description, "isPrimary", type, "warningApplicableId", "groupId", position) VALUES
('pc_speeding', 'Speeding', 'Operating a motor vehicle above the posted speed limit', true, 'INFRACTION', 'wa_traffic_1', 'pcg_traffic', 0),
('pc_reckless', 'Reckless Driving', 'Driving with willful disregard for public safety', true, 'MISDEMEANOR', 'wa_traffic_2', 'pcg_traffic', 1),
('pc_dui', 'Driving Under the Influence', 'Operating a vehicle while under the influence of alcohol or drugs', true, 'MISDEMEANOR', 'wa_traffic_3', 'pcg_traffic', 2),
('pc_no_license', 'Driving Without a License', 'Operating a motor vehicle without a valid license', true, 'INFRACTION', 'wa_traffic_1', 'pcg_traffic', 3),
('pc_expired_reg', 'Expired Registration', 'Operating a vehicle with expired registration', true, 'INFRACTION', 'wa_traffic_1', 'pcg_traffic', 4);

-- Misdemeanors & felonies (warning not applicable)
INSERT INTO "PenalCode" (id, title, description, "isPrimary", type, "warningNotApplicableId", "groupId", position) VALUES
('pc_assault', 'Assault', 'Intentionally causing bodily harm to another person', true, 'MISDEMEANOR', 'wna_mis_1', 'pcg_misdemeanor', 0),
('pc_battery', 'Battery', 'Unlawful use of force against another person', true, 'MISDEMEANOR', 'wna_mis_1', 'pcg_misdemeanor', 1),
('pc_theft', 'Petty Theft', 'Theft of property valued under $950', true, 'MISDEMEANOR', 'wna_mis_1', 'pcg_misdemeanor', 2),
('pc_vandalism', 'Vandalism', 'Willful destruction of property', true, 'MISDEMEANOR', 'wna_mis_2', 'pcg_misdemeanor', 3),
('pc_disorderly', 'Disorderly Conduct', 'Engaging in disruptive behavior in public', true, 'MISDEMEANOR', 'wna_mis_1', 'pcg_misdemeanor', 4),
('pc_drug_poss', 'Drug Possession', 'Possession of a controlled substance', true, 'MISDEMEANOR', 'wna_mis_1', 'pcg_misdemeanor', 5),
('pc_possession_stolen', 'Possession of Stolen Property', 'Possessing property known to be stolen', true, 'MISDEMEANOR', 'wna_mis_2', 'pcg_misdemeanor', 6),
('pc_robbery', 'Robbery', 'Taking property from another person by force or intimidation', true, 'FELONY', 'wna_fel_1', 'pcg_felony', 0),
('pc_grand_theft', 'Grand Theft', 'Theft of property valued over $950', true, 'FELONY', 'wna_fel_1', 'pcg_felony', 1),
('pc_murder', 'Murder', 'Unlawful killing of another person with malice', true, 'FELONY', 'wna_fel_3', 'pcg_felony', 2),
('pc_kidnapping', 'Kidnapping', 'Unlawful seizure and detention of a person', true, 'FELONY', 'wna_fel_2', 'pcg_felony', 3),
('pc_arson', 'Arson', 'Willfully setting fire to property', true, 'FELONY', 'wna_fel_2', 'pcg_felony', 4),
('pc_drug_dist', 'Drug Distribution', 'Distribution or sale of controlled substances', true, 'FELONY', 'wna_fel_1', 'pcg_felony', 5),
('pc_evading', 'Evading Police', 'Willfully fleeing from a peace officer', true, 'FELONY', 'wna_fel_1', 'pcg_felony', 6);

-- ============================================
-- 9. RECORDS (Tickets & Arrests)
-- ============================================

INSERT INTO "Violation" (id, fine, "jailTime", bail, "penalCodeId", counts) VALUES
('viol_1', 350, NULL, NULL, 'pc_speeding', 1),
('viol_2', 500, NULL, NULL, 'pc_reckless', 1),
('viol_3', 1000, 10, 2500, 'pc_dui', 1),
('viol_4', 150, NULL, NULL, 'pc_expired_reg', 1),
('viol_5', 2000, 15, 5000, 'pc_assault', 1),
('viol_6', 8000, 45, 15000, 'pc_robbery', 1),
('viol_7', 500, NULL, NULL, 'pc_theft', 1),
('viol_8', 5000, 30, 10000, 'pc_evading', 1),
('viol_9', 750, 5, 1500, 'pc_drug_poss', 1),
('viol_10', 350, NULL, NULL, 'pc_speeding', 1);

-- Ticket: David Lee - speeding + expired registration
INSERT INTO "Record" (id, type, "citizenId", "officerId", postal, address, notes, "publishStatus") VALUES
('rec_ticket_david', 'TICKET', 'cit_david_lee', 'off_marcus_lspd', '012', 'Strawberry Ave & Grove St', 'Subject was clocked doing 85 in a 45 zone. Vehicle registration expired.', 'PUBLISHED');
INSERT INTO "_RecordToViolation" ("A", "B") VALUES
('rec_ticket_david', 'viol_1'),
('rec_ticket_david', 'viol_4');

-- Written Warning: Alex Rivera - speeding
INSERT INTO "Record" (id, type, "citizenId", "officerId", postal, address, notes, "publishStatus") VALUES
('rec_warn_alex', 'WRITTEN_WARNING', 'cit_alex_rivera', 'off_john_lspd', '042', 'Vinewood Blvd', 'First offense, verbal warning given. Subject cooperative.', 'PUBLISHED');
INSERT INTO "_RecordToViolation" ("A", "B") VALUES
('rec_warn_alex', 'viol_10');

-- Ticket: Carlos Garcia - reckless driving
INSERT INTO "Record" (id, type, "citizenId", "officerId", postal, address, notes, "publishStatus") VALUES
('rec_ticket_carlos', 'TICKET', 'cit_carlos_garcia', 'off_mike_sahp', '042', 'Vinewood Blvd', 'Subject observed weaving through traffic at high speed. License already revoked.', 'PUBLISHED');
INSERT INTO "_RecordToViolation" ("A", "B") VALUES
('rec_ticket_carlos', 'viol_2');

-- Arrest Report: Carlos Garcia - robbery + evading
INSERT INTO "Record" (id, type, "citizenId", "officerId", postal, address, notes, "publishStatus") VALUES
('rec_arrest_carlos', 'ARREST_REPORT', 'cit_carlos_garcia', 'off_marcus_lspd', '001', 'Grove Street', 'Subject apprehended after armed robbery at 24/7 convenience store. Led officers on foot pursuit before being detained.', 'PUBLISHED');
INSERT INTO "_RecordToViolation" ("A", "B") VALUES
('rec_arrest_carlos', 'viol_6'),
('rec_arrest_carlos', 'viol_8');

-- Arrest Report: David Lee - DUI + drug possession
INSERT INTO "Record" (id, type, "citizenId", "officerId", postal, address, notes, "publishStatus") VALUES
('rec_arrest_david', 'ARREST_REPORT', 'cit_david_lee', 'off_sarah_bcso', '055', 'Elgin Ave', 'Subject pulled over for erratic driving. Failed field sobriety test. Controlled substance found in vehicle.', 'PUBLISHED');
INSERT INTO "_RecordToViolation" ("A", "B") VALUES
('rec_arrest_david', 'viol_3'),
('rec_arrest_david', 'viol_9');

-- ============================================
-- 10. WARRANTS
-- ============================================

INSERT INTO "Warrant" (id, "citizenId", "officerId", description, status) VALUES
('war_carlos_1', 'cit_carlos_garcia', 'off_marcus_lspd', 'Wanted for questioning in connection to multiple armed robberies in the Los Santos area. Subject is considered armed and dangerous.', 'ACTIVE');

-- ============================================
-- 11. 911 CALLS
-- ============================================

INSERT INTO "Call911" (id, location, postal, description, name, "viaDispatch") VALUES
('call_1', 'Grove Street & Strawberry Ave', '001', 'Reports of shots fired in the area. Multiple callers reporting gunfire.', 'Anonymous Caller', false),
('call_2', '24/7 Store, Vinewood Blvd', '042', 'Armed robbery in progress. Suspect is a Hispanic male wearing a black hoodie.', 'Store Employee', false),
('call_3', 'Highway 1, Mile Marker 45', '089', 'Multi-vehicle accident on the highway. At least 3 vehicles involved. Possible injuries.', 'Passing Motorist', false),
('call_4', 'Elgin Avenue Apartments', '055', 'Domestic disturbance. Neighbors report loud yelling and sounds of items being broken.', 'Neighbor', false),
('call_5', 'Vinewood Hills Trail', '048', 'Suspicious vehicle parked at trailhead for over 48 hours. Dark colored sedan.', 'Park Ranger', false);

INSERT INTO "Call911Event" (id, "call911Id", description) VALUES
(gen_random_uuid()::text, 'call_1', 'Call received. Units dispatched to the area.'),
(gen_random_uuid()::text, 'call_1', 'Unit 1-41 en route to location.'),
(gen_random_uuid()::text, 'call_1', 'Unit 1-41 on scene. Area appears code 4. Canvassing for witnesses.'),
(gen_random_uuid()::text, 'call_2', 'Call received. Priority 1 response. All available units respond.'),
(gen_random_uuid()::text, 'call_2', 'Unit 1-55 and 2-12 en route.'),
(gen_random_uuid()::text, 'call_3', 'Call received. EMS and Fire dispatched alongside LEO.'),
(gen_random_uuid()::text, 'call_3', 'Confirmed 3 vehicles involved. 2 injuries reported.'),
(gen_random_uuid()::text, 'call_4', 'Call received. Unit 1-55 dispatched.'),
(gen_random_uuid()::text, 'call_5', 'Call received. Low priority. Unit 3-01 will check when available.');

-- ============================================
-- 12. BOLOs
-- ============================================

INSERT INTO "Bolo" (id, type, description, plate, model, color, name, "officerId") VALUES
('bolo_1', 'VEHICLE', 'Orange Chevrolet Camaro involved in armed robbery. Vehicle has aftermarket exhaust and tinted windows.', 'FAS 777', 'Chevrolet Camaro', 'Orange', NULL, 'off_marcus_lspd'),
('bolo_2', 'PERSON', 'Hispanic male, approx 5''10", 185 lbs, brown hair. Last seen wearing black hoodie. Wanted for armed robbery.', NULL, NULL, NULL, 'Carlos Garcia', 'off_marcus_lspd'),
('bolo_3', 'VEHICLE', 'Black sedan with heavy tint, possible paper plates. Seen fleeing from multiple traffic stops.', NULL, NULL, 'Black', NULL, 'off_mike_sahp'),
('bolo_4', 'OTHER', 'Multiple reports of graffiti tagging in the Vinewood area. Suspected gang activity between 2-4 AM.', NULL, NULL, NULL, NULL, 'off_sarah_bcso');

-- ============================================
-- 13. BUSINESSES
-- ============================================

INSERT INTO "Business" (id, "userId", name, address, postal, status) VALUES
('biz_emilys', 'cmlzbadjt0000scde6bat9cip', 'Chen''s Auto Parts', '789 Grove Street', '001', 'ACCEPTED'),
('biz_janes', 'cmlzbadjt0000scde6bat9cip', 'SkyHigh Aviation', '100 Airport Way', '090', 'ACCEPTED');

-- ============================================
-- 14. FLAGS ON CITIZENS & VEHICLES
-- ============================================

-- A = Citizen, B = Value
INSERT INTO "_citizenFlags" ("A", "B") VALUES
('cit_carlos_garcia', 'val_cf_violent'),
('cit_carlos_garcia', 'val_cf_felon'),
('cit_carlos_garcia', 'val_cf_gang');

-- A = RegisteredVehicle, B = Value
INSERT INTO "_vehicleFlags" ("A", "B") VALUES
('rv_carlos_camaro', 'val_vf_stolen'),
('rv_carlos_camaro', 'val_vf_wanted');

-- ============================================
-- 15. ENABLE CAD FEATURES
-- ============================================

INSERT INTO "CadFeature" (id, feature, "isEnabled", "cadId") VALUES
(gen_random_uuid()::text, 'CALLS_911', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'BLEETER', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'TOW', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'TAXI', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'COURTHOUSE', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'TRUCK_LOGS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'BUSINESS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'WEAPON_REGISTRATION', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'SOCIAL_SECURITY_NUMBERS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ACTIVE_DISPATCHERS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ACTIVE_INCIDENTS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'BADGE_NUMBERS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'DIVISIONS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'PANIC_BUTTON', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'TONES', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ACTIVE_WARRANTS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'PETS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'COURTHOUSE_POSTS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ALLOW_CITIZEN_UPDATE_LICENSE', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ALLOW_CITIZEN_DELETION_BY_NON_ADMIN', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'DMV', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'LEO_TICKETS', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'LEO_BAIL', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'ALLOW_REGULAR_LOGIN', true, 'cmlzbadjx0001scdefsp5pluv'),
(gen_random_uuid()::text, 'CITIZEN_RECORD_PAYMENTS', true, 'cmlzbadjx0001scdefsp5pluv');

-- ============================================
-- 16. USER PERMISSIONS (LEO/Dispatch/EMS)
-- ============================================

UPDATE "User" SET permissions = ARRAY[
  'Leo',
  'ViewIncidents',
  'ManageIncidents',
  'ViewImpoundLot',
  'ManageImpoundLot',
  'Dispatch',
  'EmsFd',
  'ViewEmsFdIncidents',
  'ManageEmsFdIncidents',
  'LiveMap',
  'ViewCitizens',
  'ManageCitizens',
  'ViewCitizenLogs',
  'DeleteCitizens',
  'ViewDLExams',
  'ManageDLExams',
  'ViewWeaponExams',
  'ManageWeaponExams',
  'ViewLicenseExams',
  'ManageLicenseExams',
  'ManageDMV',
  'ManageWarrants',
  'ViewWarrants',
  'DeleteRegisteredVehicles',
  'DeleteRegisteredWeapons',
  'ManageCustomFields',
  'ViewCustomFields',
  'ManagePenalCodes',
  'ManageNameChangeRequests',
  'ViewNameChangeRequests',
  'ManageExpungementRequests',
  'ViewExpungementRequests',
  'ManageCourtPosts',
  'ViewCourtPosts',
  'ManageCourtEntries',
  'ViewCourtEntries',
  'CreateBusinesses'
] WHERE id = 'cmlzbadjt0000scde6bat9cip';

COMMIT;
