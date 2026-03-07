-- Seed data for SnailyCAD v4
-- User: cmlze2m4s00008qjtsfe9cunr
-- CAD:  cmlze2m4w00018qjtezaqz2j5

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
('cit_john_doe', 'cmlze2m4s00008qjtsfe9cunr', 'John', 'Doe', '1985-03-15', 'val_gender_male', 'val_eth_white', 'Brown', 'Blue', '1234 Grove Street', '001', '180', '82', 'val_lic_valid', 'val_lic_valid', NULL, 'Mechanic', '555-0101'),
('cit_jane_smith', 'cmlze2m4s00008qjtsfe9cunr', 'Jane', 'Smith', '1990-07-22', 'val_gender_female', 'val_eth_hispanic', 'Black', 'Brown', '567 Vinewood Blvd', '042', '165', '60', 'val_lic_valid', NULL, 'val_lic_valid', 'Pilot', '555-0102'),
('cit_marcus_johnson', 'cmlze2m4s00008qjtsfe9cunr', 'Marcus', 'Johnson', '1978-11-30', 'val_gender_male', 'val_eth_black', 'Black', 'Brown', '890 Alta Street', '033', '188', '95', 'val_lic_valid', 'val_lic_valid', NULL, 'Police Officer', '555-0103'),
('cit_sarah_williams', 'cmlze2m4s00008qjtsfe9cunr', 'Sarah', 'Williams', '1995-01-10', 'val_gender_female', 'val_eth_white', 'Blonde', 'Green', '234 Elgin Ave', '055', '170', '58', 'val_lic_valid', NULL, NULL, 'Nurse', '555-0104'),
('cit_david_lee', 'cmlze2m4s00008qjtsfe9cunr', 'David', 'Lee', '1988-06-05', 'val_gender_male', 'val_eth_asian', 'Black', 'Brown', '456 Strawberry Ave', '012', '175', '73', 'val_lic_suspended', NULL, NULL, 'Taxi Driver', '555-0105'),
('cit_emily_chen', 'cmlze2m4s00008qjtsfe9cunr', 'Emily', 'Chen', '1992-09-18', 'val_gender_female', 'val_eth_asian', 'Black', 'Brown', '789 Grove Street', '001', '160', '52', 'val_lic_valid', 'val_lic_valid', NULL, 'Business Owner', '555-0106'),
('cit_carlos_garcia', 'cmlze2m4s00008qjtsfe9cunr', 'Carlos', 'Garcia', '1982-12-01', 'val_gender_male', 'val_eth_hispanic', 'Brown', 'Hazel', '321 Vinewood Blvd', '042', '178', '85', 'val_lic_revoked', NULL, NULL, 'Unemployed', '555-0107'),
('cit_rachel_taylor', 'cmlze2m4s00008qjtsfe9cunr', 'Rachel', 'Taylor', '1998-04-25', 'val_gender_female', 'val_eth_white', 'Red', 'Blue', '654 Alta Street', '033', '168', '55', 'val_lic_valid', NULL, NULL, 'Paramedic', '555-0108'),
('cit_mike_brown', 'cmlze2m4s00008qjtsfe9cunr', 'Mike', 'Brown', '1975-08-14', 'val_gender_male', 'val_eth_white', 'Gray', 'Brown', '987 Elgin Ave', '055', '185', '90', 'val_lic_valid', 'val_lic_valid', 'val_lic_valid', 'Fire Chief', '555-0109'),
('cit_alex_rivera', 'cmlze2m4s00008qjtsfe9cunr', 'Alex', 'Rivera', '2000-02-28', 'val_gender_nb', 'val_eth_hispanic', 'Brown', 'Green', '111 Strawberry Ave', '012', '172', '65', 'val_lic_valid', NULL, NULL, 'Student', '555-0110');

-- ============================================
-- 3. REGISTERED VEHICLES
-- ============================================

INSERT INTO "RegisteredVehicle" (id, "userId", "citizenId", "vinNumber", plate, "modelId", color, "registrationStatusId", "insuranceStatusId", "inspectionStatus", "taxStatus") VALUES
('rv_john_crown', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'VIN00000001', 'LSP 001', 'vv_crown', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_john_f150', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'VIN00000002', 'LSP 002', 'vv_f150', 'Black', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_jane_mustang', 'cmlze2m4s00008qjtsfe9cunr', 'cit_jane_smith', 'VIN00000003', 'AIR 420', 'vv_mustang', 'Red', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_marcus_charger', 'cmlze2m4s00008qjtsfe9cunr', 'cit_marcus_johnson', 'VIN00000004', 'COP 101', 'vv_charger', 'Black', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_sarah_civic', 'cmlze2m4s00008qjtsfe9cunr', 'cit_sarah_williams', 'VIN00000005', 'MED 001', 'vv_civic', 'Silver', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_david_corolla', 'cmlze2m4s00008qjtsfe9cunr', 'cit_david_lee', 'VIN00000006', 'TAX 999', 'vv_corolla', 'Yellow', 'val_reg_registered', 'val_ins_uninsured', 'FAILED', 'UNTAXED'),
('rv_emily_tesla', 'cmlze2m4s00008qjtsfe9cunr', 'cit_emily_chen', 'VIN00000007', 'ECO 123', 'vv_tesla3', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_carlos_camaro', 'cmlze2m4s00008qjtsfe9cunr', 'cit_carlos_garcia', 'VIN00000008', 'FAS 777', 'vv_camaro', 'Orange', 'val_reg_unregistered', 'val_ins_uninsured', NULL, 'UNTAXED'),
('rv_rachel_explorer', 'cmlze2m4s00008qjtsfe9cunr', 'cit_rachel_taylor', 'VIN00000009', 'EMS 202', 'vv_explorer', 'White', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_mike_tahoe', 'cmlze2m4s00008qjtsfe9cunr', 'cit_mike_brown', 'VIN00000010', 'FIR 911', 'vv_tahoe', 'Red', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_alex_bmw', 'cmlze2m4s00008qjtsfe9cunr', 'cit_alex_rivera', 'VIN00000011', 'STU 420', 'vv_bmw3', 'Blue', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED'),
('rv_john_silverado', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'VIN00000012', 'BIG 350', 'vv_silverado', 'Gray', 'val_reg_registered', 'val_ins_insured', 'PASSED', 'TAXED');

UPDATE "RegisteredVehicle" SET "reportedStolen" = true WHERE id = 'rv_carlos_camaro';

-- ============================================
-- 4. WEAPONS
-- ============================================

INSERT INTO "Weapon" (id, "userId", "citizenId", "serialNumber", "registrationStatusId", "modelId") VALUES
('wp_john_glock', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'SN-GLK-00001', 'val_reg_registered', 'wv_glock17'),
('wp_john_ar15', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'SN-AR15-00001', 'val_reg_registered', 'wv_ar15'),
('wp_marcus_sig', 'cmlze2m4s00008qjtsfe9cunr', 'cit_marcus_johnson', 'SN-SIG-00001', 'val_reg_registered', 'wv_sig226'),
('wp_marcus_870', 'cmlze2m4s00008qjtsfe9cunr', 'cit_marcus_johnson', 'SN-REM-00001', 'val_reg_registered', 'wv_remington870'),
('wp_emily_glock', 'cmlze2m4s00008qjtsfe9cunr', 'cit_emily_chen', 'SN-GLK-00002', 'val_reg_registered', 'wv_glock17'),
('wp_mike_m1911', 'cmlze2m4s00008qjtsfe9cunr', 'cit_mike_brown', 'SN-1911-00001', 'val_reg_registered', 'wv_m1911');

-- ============================================
-- 5. OFFICERS (LEO)
-- ============================================

INSERT INTO "Officer" (id, "departmentId", callsign, callsign2, "citizenId", "userId", "rankId", "badgeNumber") VALUES
('off_marcus_lspd', 'dv_lspd', '1', '41', 'cit_marcus_johnson', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_sergeant', 141),
('off_john_lspd', 'dv_lspd', '1', '55', 'cit_john_doe', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_officer', 155),
('off_sarah_bcso', 'dv_bcso', '2', '12', 'cit_sarah_williams', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_corporal', 212),
('off_mike_sahp', 'dv_sahp', '3', '01', 'cit_mike_brown', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_lieutenant', 301);

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
('ems_rachel', 'dv_ems', 'E', '01', 'cit_rachel_taylor', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_officer', 501),
('ems_sarah', 'dv_lsfd', 'F', '02', 'cit_sarah_williams', 'cmlze2m4s00008qjtsfe9cunr', 'val_rank_corporal', 502);

-- ============================================
-- 7. MEDICAL RECORDS
-- ============================================

INSERT INTO "MedicalRecord" (id, "userId", "citizenId", type, description, "bloodGroupId") VALUES
('mr_john_1', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'Asthma', 'Mild asthma, uses inhaler as needed', 'val_bg_opos'),
('mr_jane_1', 'cmlze2m4s00008qjtsfe9cunr', 'cit_jane_smith', 'Diabetes Type 2', 'Manages with medication and diet', 'val_bg_apos'),
('mr_carlos_1', 'cmlze2m4s00008qjtsfe9cunr', 'cit_carlos_garcia', 'Gunshot Wound', 'GSW to left shoulder, treated at Pillbox Medical', 'val_bg_bpos'),
('mr_david_1', 'cmlze2m4s00008qjtsfe9cunr', 'cit_david_lee', 'Broken Arm', 'Right arm fracture from vehicle accident', 'val_bg_abneg'),
('mr_alex_1', 'cmlze2m4s00008qjtsfe9cunr', 'cit_alex_rivera', 'Allergies', 'Severe peanut allergy - carries EpiPen', 'val_bg_oneg');

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
('biz_emilys', 'cmlze2m4s00008qjtsfe9cunr', 'Chen''s Auto Parts', '789 Grove Street', '001', 'ACCEPTED'),
('biz_janes', 'cmlze2m4s00008qjtsfe9cunr', 'SkyHigh Aviation', '100 Airport Way', '090', 'ACCEPTED');

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
(gen_random_uuid()::text, 'CALLS_911', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'BLEETER', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'TOW', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'TAXI', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'COURTHOUSE', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'TRUCK_LOGS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'BUSINESS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'WEAPON_REGISTRATION', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'SOCIAL_SECURITY_NUMBERS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ACTIVE_DISPATCHERS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ACTIVE_INCIDENTS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'BADGE_NUMBERS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'DIVISIONS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'PANIC_BUTTON', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'TONES', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ACTIVE_WARRANTS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'PETS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'COURTHOUSE_POSTS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ALLOW_CITIZEN_UPDATE_LICENSE', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ALLOW_CITIZEN_DELETION_BY_NON_ADMIN', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'DMV', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'LEO_TICKETS', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'LEO_BAIL', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'ALLOW_REGULAR_LOGIN', true, 'cmlze2m4w00018qjtezaqz2j5'),
(gen_random_uuid()::text, 'CITIZEN_RECORD_PAYMENTS', true, 'cmlze2m4w00018qjtezaqz2j5');

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
] WHERE id = 'cmlze2m4s00008qjtsfe9cunr';

-- ============================================
-- DRIVERS LICENSE CATEGORIES
-- ============================================

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_dlc_a', 'DRIVERSLICENSE_CATEGORY', 'Class A - Motorcycle', false, 0),
('val_dlc_b', 'DRIVERSLICENSE_CATEGORY', 'Class B - Passenger Vehicle', true, 1),
('val_dlc_c', 'DRIVERSLICENSE_CATEGORY', 'Class C - Commercial Vehicle', false, 2),
('val_dlc_d', 'DRIVERSLICENSE_CATEGORY', 'Class D - Heavy Truck', false, 3),
('val_dlc_ppl', 'DRIVERSLICENSE_CATEGORY', 'Private Pilot License', false, 4),
('val_dlc_boat', 'DRIVERSLICENSE_CATEGORY', 'Boating License', false, 5),
('val_dlc_firearm', 'DRIVERSLICENSE_CATEGORY', 'Firearms Safety Certificate', false, 6),
('val_dlc_hunting', 'DRIVERSLICENSE_CATEGORY', 'Hunting Safety Certificate', false, 7),
('val_dlc_fishing', 'DRIVERSLICENSE_CATEGORY', 'Fishing Permit', false, 8);

INSERT INTO "DriversLicenseCategoryValue" (id, "valueId", type, description) VALUES
('dlcv_a', 'val_dlc_a', 'AUTOMOTIVE', 'Motorcycles and motorized two-wheelers'),
('dlcv_b', 'val_dlc_b', 'AUTOMOTIVE', 'Standard passenger vehicles up to 10,000 lbs'),
('dlcv_c', 'val_dlc_c', 'AUTOMOTIVE', 'Commercial vehicles up to 26,000 lbs'),
('dlcv_d', 'val_dlc_d', 'AUTOMOTIVE', 'Heavy commercial vehicles over 26,000 lbs'),
('dlcv_ppl', 'val_dlc_ppl', 'AVIATION', 'Private pilot license for single-engine aircraft'),
('dlcv_boat', 'val_dlc_boat', 'WATER', 'Motorized watercraft operation'),
('dlcv_firearm', 'val_dlc_firearm', 'FIREARM', 'Basic firearms safety and handling'),
('dlcv_hunting', 'val_dlc_hunting', 'HUNTING', 'Hunting safety and regulations'),
('dlcv_fishing', 'val_dlc_fishing', 'FISHING', 'Recreational fishing permit');

-- Link citizens to DL categories (A = Citizen, B = DriversLicenseCategoryValue)
INSERT INTO "_dlCategoryToDLCategory" ("A", "B") VALUES
('cit_john_doe', 'dlcv_a'),
('cit_john_doe', 'dlcv_b'),
('cit_john_doe', 'dlcv_firearm'),
('cit_jane_smith', 'dlcv_b'),
('cit_jane_smith', 'dlcv_ppl'),
('cit_marcus_johnson', 'dlcv_b'),
('cit_marcus_johnson', 'dlcv_c'),
('cit_marcus_johnson', 'dlcv_firearm'),
('cit_sarah_williams', 'dlcv_b'),
('cit_david_lee', 'dlcv_b'),
('cit_david_lee', 'dlcv_d'),
('cit_emily_chen', 'dlcv_b'),
('cit_emily_chen', 'dlcv_firearm'),
('cit_mike_brown', 'dlcv_b'),
('cit_mike_brown', 'dlcv_c'),
('cit_mike_brown', 'dlcv_ppl'),
('cit_mike_brown', 'dlcv_boat'),
('cit_mike_brown', 'dlcv_firearm'),
('cit_alex_rivera', 'dlcv_b'),
('cit_rachel_taylor', 'dlcv_b');

-- ============================================
-- EMERGENCY VEHICLES
-- ============================================

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_ev_crown_patrol', 'EMERGENCY_VEHICLE', 'Ford Crown Vic (Patrol)', false, 0),
('val_ev_charger_patrol', 'EMERGENCY_VEHICLE', 'Dodge Charger (Patrol)', false, 1),
('val_ev_explorer_patrol', 'EMERGENCY_VEHICLE', 'Ford Explorer (Patrol)', false, 2),
('val_ev_tahoe_patrol', 'EMERGENCY_VEHICLE', 'Chevy Tahoe (Patrol)', false, 3),
('val_ev_ambulance', 'EMERGENCY_VEHICLE', 'Ambulance', false, 4),
('val_ev_firetruck', 'EMERGENCY_VEHICLE', 'Fire Engine', false, 5),
('val_ev_motorcycle', 'EMERGENCY_VEHICLE', 'Police Motorcycle', false, 6),
('val_ev_helicopter', 'EMERGENCY_VEHICLE', 'Police Helicopter', false, 7);

INSERT INTO "EmergencyVehicleValue" (id, "valueId", description) VALUES
('evv_crown_patrol', 'val_ev_crown_patrol', 'Standard patrol vehicle - LSPD'),
('evv_charger_patrol', 'val_ev_charger_patrol', 'Pursuit-rated patrol vehicle'),
('evv_explorer_patrol', 'val_ev_explorer_patrol', 'SUV patrol vehicle'),
('evv_tahoe_patrol', 'val_ev_tahoe_patrol', 'SUV patrol / supervisor vehicle'),
('evv_ambulance', 'val_ev_ambulance', 'Emergency medical transport'),
('evv_firetruck', 'val_ev_firetruck', 'Fire suppression and rescue'),
('evv_motorcycle', 'val_ev_motorcycle', 'Traffic enforcement motorcycle'),
('evv_helicopter', 'val_ev_helicopter', 'Air support unit');

-- Link emergency vehicles to departments (A = DepartmentValue, B = EmergencyVehicleValue)
INSERT INTO "_DepartmentValueToEmergencyVehicleValue" ("A", "B") VALUES
('dv_lspd', 'evv_crown_patrol'),
('dv_lspd', 'evv_charger_patrol'),
('dv_lspd', 'evv_explorer_patrol'),
('dv_lspd', 'evv_helicopter'),
('dv_bcso', 'evv_tahoe_patrol'),
('dv_bcso', 'evv_explorer_patrol'),
('dv_sahp', 'evv_charger_patrol'),
('dv_sahp', 'evv_motorcycle'),
('dv_ems', 'evv_ambulance'),
('dv_lsfd', 'evv_firetruck'),
('dv_lsfd', 'evv_ambulance');

-- ============================================
-- QUALIFICATIONS & AWARDS
-- ============================================

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_qual_firearms', 'QUALIFICATION', 'Firearms Proficiency', false, 0),
('val_qual_taser', 'QUALIFICATION', 'Taser Certification', false, 1),
('val_qual_cpr', 'QUALIFICATION', 'CPR/First Aid', false, 2),
('val_qual_driving', 'QUALIFICATION', 'Advanced Driving', false, 3),
('val_qual_k9', 'QUALIFICATION', 'K-9 Handler', false, 4),
('val_qual_swat', 'QUALIFICATION', 'SWAT Training', false, 5),
('val_qual_negotiator', 'QUALIFICATION', 'Crisis Negotiator', false, 6),
('val_award_valor', 'QUALIFICATION', 'Medal of Valor', false, 7),
('val_award_service', 'QUALIFICATION', 'Distinguished Service', false, 8),
('val_award_life', 'QUALIFICATION', 'Life Saving Award', false, 9);

INSERT INTO "QualificationValue" (id, "valueId", "qualificationType", description) VALUES
('qv_firearms', 'val_qual_firearms', 'QUALIFICATION', 'Annual firearms proficiency and safety certification'),
('qv_taser', 'val_qual_taser', 'QUALIFICATION', 'Conducted energy weapon deployment certification'),
('qv_cpr', 'val_qual_cpr', 'QUALIFICATION', 'CPR, AED, and basic first aid certification'),
('qv_driving', 'val_qual_driving', 'QUALIFICATION', 'Emergency vehicle operations and pursuit driving'),
('qv_k9', 'val_qual_k9', 'QUALIFICATION', 'Canine unit handler certification'),
('qv_swat', 'val_qual_swat', 'QUALIFICATION', 'Special weapons and tactics team training'),
('qv_negotiator', 'val_qual_negotiator', 'QUALIFICATION', 'Hostage and crisis negotiation training'),
('qv_valor', 'val_award_valor', 'AWARD', 'Awarded for exceptional bravery in the line of duty'),
('qv_service', 'val_award_service', 'AWARD', 'Awarded for outstanding service to the department'),
('qv_life', 'val_award_life', 'AWARD', 'Awarded for actions that directly saved a life');

-- Link qualifications to departments (A = DepartmentValue, B = QualificationValue)
INSERT INTO "_DepartmentValueToQualificationValue" ("A", "B") VALUES
('dv_lspd', 'qv_firearms'),
('dv_lspd', 'qv_taser'),
('dv_lspd', 'qv_cpr'),
('dv_lspd', 'qv_driving'),
('dv_lspd', 'qv_swat'),
('dv_bcso', 'qv_firearms'),
('dv_bcso', 'qv_k9'),
('dv_bcso', 'qv_cpr'),
('dv_sahp', 'qv_firearms'),
('dv_sahp', 'qv_driving'),
('dv_ems', 'qv_cpr'),
('dv_lsfd', 'qv_cpr');

-- Assign qualifications to officers/deputies
INSERT INTO "UnitQualification" (id, "qualificationId", "officerId") VALUES
('uq_marcus_firearms', 'qv_firearms', 'off_marcus_lspd'),
('uq_marcus_taser', 'qv_taser', 'off_marcus_lspd'),
('uq_marcus_driving', 'qv_driving', 'off_marcus_lspd'),
('uq_marcus_swat', 'qv_swat', 'off_marcus_lspd'),
('uq_marcus_valor', 'qv_valor', 'off_marcus_lspd'),
('uq_john_firearms', 'qv_firearms', 'off_john_lspd'),
('uq_john_taser', 'qv_taser', 'off_john_lspd'),
('uq_john_cpr', 'qv_cpr', 'off_john_lspd'),
('uq_sarah_firearms', 'qv_firearms', 'off_sarah_bcso'),
('uq_sarah_k9', 'qv_k9', 'off_sarah_bcso'),
('uq_sarah_service', 'qv_service', 'off_sarah_bcso'),
('uq_mike_firearms', 'qv_firearms', 'off_mike_sahp'),
('uq_mike_driving', 'qv_driving', 'off_mike_sahp'),
('uq_mike_negotiator', 'qv_negotiator', 'off_mike_sahp');

INSERT INTO "UnitQualification" (id, "qualificationId", "emsFdDeputyId") VALUES
('uq_rachel_cpr', 'qv_cpr', 'ems_rachel'),
('uq_rachel_life', 'qv_life', 'ems_rachel'),
('uq_sarah_ems_cpr', 'qv_cpr', 'ems_sarah');

-- ============================================
-- OFFICER LOGS (duty shifts)
-- ============================================

INSERT INTO "OfficerLog" (id, "startedAt", "endedAt", "userId", "officerId") VALUES
('ol_1', '2026-02-22 06:00:00', '2026-02-22 14:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_marcus_lspd'),
('ol_2', '2026-02-22 14:00:00', '2026-02-22 22:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_john_lspd'),
('ol_3', '2026-02-22 06:00:00', '2026-02-22 14:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_sarah_bcso'),
('ol_4', '2026-02-21 22:00:00', '2026-02-22 06:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_mike_sahp'),
('ol_5', '2026-02-23 06:00:00', NULL, 'cmlze2m4s00008qjtsfe9cunr', 'off_marcus_lspd'),
('ol_6', '2026-02-20 06:00:00', '2026-02-20 14:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_marcus_lspd'),
('ol_7', '2026-02-20 14:00:00', '2026-02-20 22:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'off_john_lspd');

INSERT INTO "OfficerLog" (id, "startedAt", "endedAt", "userId", "emsFdDeputyId") VALUES
('ol_ems_1', '2026-02-22 06:00:00', '2026-02-22 18:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'ems_rachel'),
('ol_ems_2', '2026-02-22 18:00:00', '2026-02-23 06:00:00', 'cmlze2m4s00008qjtsfe9cunr', 'ems_sarah'),
('ol_ems_3', '2026-02-23 06:00:00', NULL, 'cmlze2m4s00008qjtsfe9cunr', 'ems_rachel');

-- ============================================
-- LEO INCIDENTS
-- ============================================

INSERT INTO "LeoIncident" (id, description, postal, "creatorId", "firearmsInvolved", "injuriesOrFatalities", "arrestsMade", "isActive", "situationCodeId") VALUES
('inc_1', 'Armed robbery at 24/7 convenience store on Grove Street. Suspect fled on foot. One employee sustained minor injuries. Suspect later apprehended after foot pursuit.', '001', 'off_marcus_lspd', true, true, true, false, 'sv_sc_shoot'),
('inc_2', 'High-speed vehicle pursuit on Highway 1. Suspect vehicle - orange Camaro. Pursuit lasted approximately 15 minutes before suspect vehicle crashed. Driver fled on foot.', '089', 'off_mike_sahp', false, false, false, true, 'sv_sc_pursuit'),
('inc_3', 'Reports of gang-related graffiti and vandalism in Vinewood area. Multiple properties affected. Investigation ongoing.', '042', 'off_sarah_bcso', false, false, false, true, NULL);

INSERT INTO "IncidentEvent" (id, "incidentId", description) VALUES
(gen_random_uuid()::text, 'inc_1', 'Dispatch received report of armed robbery at Grove Street 24/7.'),
(gen_random_uuid()::text, 'inc_1', 'Sgt. Johnson (1-41) and Officer Doe (1-55) responding.'),
(gen_random_uuid()::text, 'inc_1', 'Suspect fled on foot southbound on Grove Street.'),
(gen_random_uuid()::text, 'inc_1', 'Suspect apprehended at Strawberry Ave. One in custody.'),
(gen_random_uuid()::text, 'inc_1', 'EMS on scene treating store employee for minor lacerations.'),
(gen_random_uuid()::text, 'inc_2', 'SAHP unit 3-01 attempted traffic stop on orange Camaro, suspect fled.'),
(gen_random_uuid()::text, 'inc_2', 'Pursuit reaching speeds of 120+ mph on Highway 1.'),
(gen_random_uuid()::text, 'inc_2', 'Suspect vehicle crashed at mile marker 52. Driver fled into wooded area.'),
(gen_random_uuid()::text, 'inc_2', 'K-9 unit requested to track suspect. Search ongoing.'),
(gen_random_uuid()::text, 'inc_3', 'Multiple reports of fresh graffiti tagging on Vinewood Blvd businesses.'),
(gen_random_uuid()::text, 'inc_3', 'Deputy Williams canvassing area. Requesting surveillance footage from businesses.');

-- Link officers to incidents (A = LeoIncident, B = Officer)
INSERT INTO "_involvedOfficers" ("A", "B") VALUES
('inc_1', 'off_marcus_lspd'),
('inc_1', 'off_john_lspd'),
('inc_2', 'off_mike_sahp'),
('inc_2', 'off_sarah_bcso'),
('inc_3', 'off_sarah_bcso');

-- IncidentInvolvedUnit
INSERT INTO "IncidentInvolvedUnit" (id, "officerId", "incidentId") VALUES
(gen_random_uuid()::text, 'off_marcus_lspd', 'inc_1'),
(gen_random_uuid()::text, 'off_john_lspd', 'inc_1'),
(gen_random_uuid()::text, 'off_mike_sahp', 'inc_2'),
(gen_random_uuid()::text, 'off_sarah_bcso', 'inc_2'),
(gen_random_uuid()::text, 'off_sarah_bcso', 'inc_3');

INSERT INTO "IncidentInvolvedUnit" (id, "emsFdDeputyId", "incidentId") VALUES
(gen_random_uuid()::text, 'ems_rachel', 'inc_1');

-- ============================================
-- ASSIGNED UNITS TO 911 CALLS
-- ============================================

INSERT INTO "AssignedUnit" (id, "officerId", "call911Id") VALUES
(gen_random_uuid()::text, 'off_marcus_lspd', 'call_1'),
(gen_random_uuid()::text, 'off_john_lspd', 'call_2'),
(gen_random_uuid()::text, 'off_sarah_bcso', 'call_2'),
(gen_random_uuid()::text, 'off_mike_sahp', 'call_3'),
(gen_random_uuid()::text, 'off_john_lspd', 'call_4');

INSERT INTO "AssignedUnit" (id, "emsFdDeputyId", "call911Id") VALUES
(gen_random_uuid()::text, 'ems_rachel', 'call_3'),
(gen_random_uuid()::text, 'ems_sarah', 'call_3');

-- Link calls to departments/divisions
INSERT INTO "_Call911ToDepartmentValue" ("A", "B") VALUES
('call_1', 'dv_lspd'),
('call_2', 'dv_lspd'),
('call_2', 'dv_bcso'),
('call_3', 'dv_sahp'),
('call_3', 'dv_ems'),
('call_3', 'dv_lsfd'),
('call_4', 'dv_lspd'),
('call_5', 'dv_bcso');

-- ============================================
-- ASSIGNED WARRANT OFFICERS
-- ============================================

INSERT INTO "AssignedWarrantOfficer" (id, "officerId", "warrantId") VALUES
(gen_random_uuid()::text, 'off_marcus_lspd', 'war_carlos_1'),
(gen_random_uuid()::text, 'off_john_lspd', 'war_carlos_1');

-- ============================================
-- IMPOUNDED VEHICLES
-- ============================================

INSERT INTO "ImpoundedVehicle" (id, "registeredVehicleId", "valueId", "officerId") VALUES
('imp_1', 'rv_carlos_camaro', 'val_imp_city', 'off_marcus_lspd'),
('imp_2', 'rv_david_corolla', 'val_imp_county', 'off_sarah_bcso');

UPDATE "RegisteredVehicle" SET impounded = true WHERE id IN ('rv_carlos_camaro', 'rv_david_corolla');

-- ============================================
-- SEIZED ITEMS (from arrest records)
-- ============================================

INSERT INTO "SeizedItem" (id, "recordId", item, quantity, illegal) VALUES
(gen_random_uuid()::text, 'rec_arrest_carlos', 'Handgun (unregistered)', 1, true),
(gen_random_uuid()::text, 'rec_arrest_carlos', 'Cash ($2,340)', 1, false),
(gen_random_uuid()::text, 'rec_arrest_carlos', 'Ski mask', 1, false),
(gen_random_uuid()::text, 'rec_arrest_david', 'Marijuana (12g)', 1, true),
(gen_random_uuid()::text, 'rec_arrest_david', 'Glass pipe', 1, true),
(gen_random_uuid()::text, 'rec_arrest_david', 'Open container (alcohol)', 2, false);

-- ============================================
-- RECORD LOGS
-- ============================================

INSERT INTO "RecordLog" (id, "citizenId", "recordId") VALUES
(gen_random_uuid()::text, 'cit_david_lee', 'rec_ticket_david'),
(gen_random_uuid()::text, 'cit_alex_rivera', 'rec_warn_alex'),
(gen_random_uuid()::text, 'cit_carlos_garcia', 'rec_ticket_carlos'),
(gen_random_uuid()::text, 'cit_carlos_garcia', 'rec_arrest_carlos'),
(gen_random_uuid()::text, 'cit_david_lee', 'rec_arrest_david');

INSERT INTO "RecordLog" (id, "citizenId", "warrantId") VALUES
(gen_random_uuid()::text, 'cit_carlos_garcia', 'war_carlos_1');

-- ============================================
-- SUSPENDED LICENSES & LICENSE POINTS
-- ============================================

INSERT INTO "SuspendedCitizenLicenses" (id, "driverLicense", "driverLicenseTimeEnd") VALUES
('susp_david', true, '2026-06-01'),
('susp_carlos', true, NULL);

UPDATE "Citizen" SET "suspendedLicensesId" = 'susp_david' WHERE id = 'cit_david_lee';
UPDATE "Citizen" SET "suspendedLicensesId" = 'susp_carlos' WHERE id = 'cit_carlos_garcia';

INSERT INTO "CitizenLicensePoints" (id, "driverLicensePoints", "firearmsLicensePoints") VALUES
('clp_david', 9, 0),
('clp_carlos', 12, 0),
('clp_alex', 3, 0);

UPDATE "Citizen" SET "licensePointsId" = 'clp_david' WHERE id = 'cit_david_lee';
UPDATE "Citizen" SET "licensePointsId" = 'clp_carlos' WHERE id = 'cit_carlos_garcia';
UPDATE "Citizen" SET "licensePointsId" = 'clp_alex' WHERE id = 'cit_alex_rivera';

-- ============================================
-- TOW CALLS
-- ============================================

INSERT INTO "TowCall" (id, location, postal, plate, model, name, description, "creatorId", ended) VALUES
(gen_random_uuid()::text, 'Highway 1, Mile Marker 52', '089', 'FAS 777', 'Chevrolet Camaro', 'Officer Johnson', 'Vehicle involved in pursuit. Crashed and abandoned. Needs tow to city impound.', 'cit_marcus_johnson', false),
(gen_random_uuid()::text, 'Elgin Ave & 3rd Street', '055', 'TAX 999', 'Toyota Corolla', 'Deputy Williams', 'Vehicle impounded following DUI arrest. Tow to county impound yard.', 'cit_sarah_williams', false),
(gen_random_uuid()::text, 'Vinewood Blvd Parking Lot', '042', NULL, NULL, 'Jane Smith', 'My car broke down in the parking lot. Won''t start. Need tow to mechanic.', 'cit_jane_smith', true),
(gen_random_uuid()::text, 'Grove Street & Strawberry Ave', '001', NULL, NULL, 'John Doe', 'Flat tire on the side of the road. Need assistance.', 'cit_john_doe', true);

-- ============================================
-- TAXI CALLS
-- ============================================

INSERT INTO "TaxiCall" (id, location, postal, name, description, "creatorId") VALUES
(gen_random_uuid()::text, 'Vinewood Hills Hotel', '048', 'Jane Smith', 'Need a ride to the airport. 2 passengers with luggage.', 'cit_jane_smith'),
(gen_random_uuid()::text, 'Pillbox Medical Center', '033', 'Alex Rivera', 'Just got discharged from hospital. Need ride home to Strawberry Ave.', 'cit_alex_rivera'),
(gen_random_uuid()::text, 'Alta Street Apartments', '033', 'Emily Chen', 'Need ride to Grove Street. Going to my shop.', 'cit_emily_chen');

-- ============================================
-- TRUCK LOGS
-- ============================================

INSERT INTO "TruckLog" (id, "citizenId", "userId", "vehicleId", "startedAt", "endedAt", notes) VALUES
(gen_random_uuid()::text, 'cit_john_doe', 'cmlze2m4s00008qjtsfe9cunr', 'rv_john_f150', '2026-02-20 08:00:00', '2026-02-20 16:30:00', 'Delivery route: Grove St warehouse to Vinewood distribution center. 3 stops.'),
(gen_random_uuid()::text, 'cit_john_doe', 'cmlze2m4s00008qjtsfe9cunr', 'rv_john_silverado', '2026-02-21 07:00:00', '2026-02-21 15:00:00', 'Construction materials from port to Alta Street job site. Heavy load.'),
(gen_random_uuid()::text, 'cit_john_doe', 'cmlze2m4s00008qjtsfe9cunr', 'rv_john_f150', '2026-02-22 09:00:00', '2026-02-22 17:00:00', 'Furniture delivery. 5 residential stops across Los Santos.');

-- ============================================
-- PETS & PET MEDICAL RECORDS
-- ============================================

INSERT INTO "Pet" (id, name, breed, color, weight, "dateOfBirth", "citizenId") VALUES
('pet_john_dog', 'Rex', 'German Shepherd', 'Black and Tan', '35', '2020-05-10', 'cit_john_doe'),
('pet_sarah_cat', 'Whiskers', 'Maine Coon', 'Orange Tabby', '6', '2021-03-15', 'cit_sarah_williams'),
('pet_alex_dog', 'Luna', 'Golden Retriever', 'Golden', '30', '2022-01-20', 'cit_alex_rivera'),
('pet_emily_cat', 'Mochi', 'Siamese', 'Cream Point', '4', '2023-06-01', 'cit_emily_chen'),
('pet_mike_dog', 'Chief', 'Dalmatian', 'White with Black Spots', '28', '2019-11-15', 'cit_mike_brown');

INSERT INTO "PetMedicalRecord" (id, "petId", type, description) VALUES
(gen_random_uuid()::text, 'pet_john_dog', 'Hip Dysplasia', 'Mild hip dysplasia diagnosed. Managing with supplements and weight control.'),
(gen_random_uuid()::text, 'pet_john_dog', 'Annual Vaccination', 'Rabies, DHPP, Bordetella. All up to date.'),
(gen_random_uuid()::text, 'pet_sarah_cat', 'Annual Checkup', 'Healthy. Weight normal. Teeth cleaned.'),
(gen_random_uuid()::text, 'pet_alex_dog', 'Allergies', 'Seasonal allergies. Prescribed antihistamines.'),
(gen_random_uuid()::text, 'pet_mike_dog', 'Torn ACL', 'Surgery performed on right rear leg. Recovery progressing well.');

-- ============================================
-- DOCTOR VISITS
-- ============================================

INSERT INTO "DoctorVisit" (id, "userId", "citizenId", diagnosis, description, conditions, medications) VALUES
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'Acute Asthma Exacerbation', 'Patient presented with wheezing and shortness of breath. Nebulizer treatment administered.', 'Asthma', 'Albuterol inhaler PRN'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'cit_carlos_garcia', 'Gunshot Wound - Left Shoulder', 'GSW through-and-through. Wound cleaned and sutured. No bone or major vessel damage.', 'Gunshot wound, pain', 'Amoxicillin 500mg, Ibuprofen 800mg'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'cit_david_lee', 'Fracture - Right Radius', 'Closed fracture of right radius from vehicle accident. Cast applied.', 'Fracture', 'Hydrocodone 5mg PRN pain'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'cit_alex_rivera', 'Allergic Reaction', 'Anaphylactic reaction to peanuts. Epinephrine administered. Patient stabilized.', 'Peanut allergy, anaphylaxis', 'EpiPen (refill), Benadryl PRN'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'cit_rachel_taylor', 'Annual Physical', 'Routine physical exam. All vitals normal. Patient in good health.', NULL, NULL);

-- ============================================
-- LICENSE EXAMS
-- ============================================

INSERT INTO "LicenseExam" (id, "theoryExam", "practiceExam", status, type, "citizenId", "licenseId") VALUES
(gen_random_uuid()::text, 'PASSED', 'PASSED', 'PASSED', 'DRIVER', 'cit_alex_rivera', 'val_lic_valid'),
(gen_random_uuid()::text, 'PASSED', 'FAILED', 'IN_PROGRESS', 'DRIVER', 'cit_carlos_garcia', 'val_lic_valid'),
(gen_random_uuid()::text, 'PASSED', 'PASSED', 'PASSED', 'PILOT', 'cit_jane_smith', 'val_lic_valid'),
(gen_random_uuid()::text, 'PASSED', NULL, 'IN_PROGRESS', 'FIREARM', 'cit_alex_rivera', 'val_lic_valid'),
(gen_random_uuid()::text, 'FAILED', NULL, 'FAILED', 'WATER', 'cit_david_lee', 'val_lic_valid');

-- ============================================
-- NOTES (officer notes on citizens/vehicles)
-- ============================================

INSERT INTO "Note" (id, text, "createdById", "citizenId") VALUES
(gen_random_uuid()::text, 'Subject has known gang affiliations in the Grove Street area. Exercise caution during encounters.', 'off_marcus_lspd', 'cit_carlos_garcia'),
(gen_random_uuid()::text, 'Subject was cooperative during last traffic stop. Seems to be getting life back on track.', 'off_john_lspd', 'cit_alex_rivera'),
(gen_random_uuid()::text, 'Multiple DUI incidents. License currently suspended. May attempt to drive regardless.', 'off_sarah_bcso', 'cit_david_lee'),
(gen_random_uuid()::text, 'Business owner at Grove Street. Reliable community witness.', 'off_marcus_lspd', 'cit_emily_chen');

INSERT INTO "Note" (id, text, "createdById", "vehicleId") VALUES
(gen_random_uuid()::text, 'Vehicle has been reported stolen. Orange Camaro with aftermarket exhaust. Linked to armed robbery.', 'off_marcus_lspd', 'rv_carlos_camaro'),
(gen_random_uuid()::text, 'Vehicle failed recent inspection. Bald tires and cracked windshield observed.', 'off_sarah_bcso', 'rv_david_corolla');

INSERT INTO "Note" (id, text, "createdById", "petId") VALUES
(gen_random_uuid()::text, 'K-9 unit evaluated Rex for potential service. Good temperament but too old for training program.', 'off_sarah_bcso', 'pet_john_dog');

-- ============================================
-- EMPLOYEE VALUES (business roles)
-- ============================================

INSERT INTO "EmployeeValue" (id, "valueId", "as") VALUES
('ev_owner', 'val_dept_lspd', 'OWNER');
-- We need proper BUSINESS_ROLE values first

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_br_owner', 'BUSINESS_ROLE', 'Owner', false, 0),
('val_br_manager', 'BUSINESS_ROLE', 'Manager', false, 1),
('val_br_employee', 'BUSINESS_ROLE', 'Employee', false, 2),
('val_br_mechanic', 'BUSINESS_ROLE', 'Mechanic', false, 3),
('val_br_pilot', 'BUSINESS_ROLE', 'Pilot', false, 4),
('val_br_instructor', 'BUSINESS_ROLE', 'Instructor', false, 5);

-- Fix: delete the wrong one and insert proper ones
DELETE FROM "EmployeeValue" WHERE id = 'ev_owner';

INSERT INTO "EmployeeValue" (id, "valueId", "as") VALUES
('ev_owner', 'val_br_owner', 'OWNER'),
('ev_manager', 'val_br_manager', 'MANAGER'),
('ev_employee', 'val_br_employee', 'EMPLOYEE'),
('ev_mechanic', 'val_br_mechanic', 'EMPLOYEE'),
('ev_pilot', 'val_br_pilot', 'EMPLOYEE'),
('ev_instructor', 'val_br_instructor', 'EMPLOYEE');

-- Link roles to businesses (A = Business, B = EmployeeValue)
INSERT INTO "_businessValueBusinessRoles" ("A", "B") VALUES
('biz_emilys', 'ev_owner'),
('biz_emilys', 'ev_manager'),
('biz_emilys', 'ev_mechanic'),
('biz_emilys', 'ev_employee'),
('biz_janes', 'ev_owner'),
('biz_janes', 'ev_pilot'),
('biz_janes', 'ev_instructor');

-- ============================================
-- EMPLOYEES
-- ============================================

INSERT INTO "Employee" (id, "userId", "citizenId", "businessId", "roleId", "employeeOfTheMonth", "canCreatePosts", "canManageEmployees", "canManageVehicles") VALUES
('emp_emily_owner', 'cmlze2m4s00008qjtsfe9cunr', 'cit_emily_chen', 'biz_emilys', 'ev_owner', false, true, true, true),
('emp_john_mechanic', 'cmlze2m4s00008qjtsfe9cunr', 'cit_john_doe', 'biz_emilys', 'ev_mechanic', true, true, false, false),
('emp_alex_employee', 'cmlze2m4s00008qjtsfe9cunr', 'cit_alex_rivera', 'biz_emilys', 'ev_employee', false, false, false, false),
('emp_jane_owner', 'cmlze2m4s00008qjtsfe9cunr', 'cit_jane_smith', 'biz_janes', 'ev_owner', false, true, true, true),
('emp_mike_pilot', 'cmlze2m4s00008qjtsfe9cunr', 'cit_mike_brown', 'biz_janes', 'ev_pilot', false, true, false, false);

-- Register business vehicles (A = Business, B = RegisteredVehicle)
INSERT INTO "_registeredBusinessVehicles" ("A", "B") VALUES
('biz_emilys', 'rv_emily_tesla'),
('biz_janes', 'rv_jane_mustang');

-- ============================================
-- BUSINESS POSTS
-- ============================================

INSERT INTO "BusinessPost" (id, "userId", "employeeId", "businessId", title, body) VALUES
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'emp_emily_owner', 'biz_emilys', 'Grand Opening Sale!', 'Chen''s Auto Parts is now open! Come visit us at 789 Grove Street for all your automotive needs. 20% off all brake pads and rotors this week!'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'emp_john_mechanic', 'biz_emilys', 'Free Tire Rotation with Oil Change', 'This month only - get a free tire rotation with any oil change service. Book your appointment today!'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'emp_jane_owner', 'biz_janes', 'SkyHigh Aviation Now Accepting Students', 'We are now offering flight training courses for aspiring pilots. Private pilot license program starts next month. Contact us for details.'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'emp_mike_pilot', 'biz_janes', 'Scenic Tour Flights Available', 'Experience Los Santos from above! We offer 30-minute scenic tour flights over the city. Perfect for special occasions.');

-- ============================================
-- BLEETER (social media)
-- ============================================

INSERT INTO "BleeterProfile" (id, name, handle, "isVerified", bio, "userId") VALUES
('bp_john', 'John Doe', 'johndoe_mechanic', false, 'Mechanic by day. Car enthusiast always. Grove Street.', 'cmlze2m4s00008qjtsfe9cunr');

INSERT INTO "BleeterPost" (id, "creatorId", "userId", title, body) VALUES
(gen_random_uuid()::text, 'bp_john', 'cmlze2m4s00008qjtsfe9cunr', 'Beautiful day for a cruise', 'Took the Crown Vic out for a spin down the coast. Nothing beats the sound of that V8. #CarLife #LosSantos'),
(gen_random_uuid()::text, 'bp_john', 'cmlze2m4s00008qjtsfe9cunr', 'New project in the garage', 'Just picked up a classic engine block. Going to be rebuilding it over the next few weeks. Stay tuned for updates!'),
(gen_random_uuid()::text, 'bp_john', 'cmlze2m4s00008qjtsfe9cunr', 'PSA: Check your tire pressure', 'With the weather changes, your tire pressure drops. Properly inflated tires = better gas mileage and safer driving. #SafetyFirst');

-- ============================================
-- COURTHOUSE POSTS
-- ============================================

INSERT INTO "CourthousePost" (id, "userId", title) VALUES
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'State vs. Carlos Garcia - Armed Robbery'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'State vs. David Lee - DUI & Drug Possession'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'Traffic Court Session - February 2026');

-- ============================================
-- COURT ENTRIES & DATES
-- ============================================

INSERT INTO "CourtEntry" (id, title, "caseNumber") VALUES
('ce_carlos', 'State v. Carlos Garcia - Armed Robbery', 'CR-2026-0042'),
('ce_david', 'State v. David Lee - DUI & Drug Possession', 'CR-2026-0038'),
('ce_traffic', 'Traffic Violations Hearing - Feb 2026', 'TR-2026-0101');

INSERT INTO "CourtDate" (id, date, note, "courtEntryId") VALUES
(gen_random_uuid()::text, '2026-03-15 09:00:00', 'Arraignment hearing. Defendant to enter plea.', 'ce_carlos'),
(gen_random_uuid()::text, '2026-04-10 09:00:00', 'Pre-trial conference. Discovery exchange deadline.', 'ce_carlos'),
(gen_random_uuid()::text, '2026-05-01 09:00:00', 'Trial date. Jury selection begins.', 'ce_carlos'),
(gen_random_uuid()::text, '2026-03-05 10:00:00', 'Arraignment and plea hearing.', 'ce_david'),
(gen_random_uuid()::text, '2026-03-20 10:00:00', 'Sentencing hearing if plea deal accepted.', 'ce_david'),
(gen_random_uuid()::text, '2026-03-01 14:00:00', 'Traffic court session for outstanding citations.', 'ce_traffic');

-- Link records to court entries
UPDATE "Record" SET "CourtEntryId" = 'ce_carlos' WHERE id = 'rec_arrest_carlos';
UPDATE "Record" SET "CourtEntryId" = 'ce_david' WHERE id = 'rec_arrest_david';

-- ============================================
-- EXPUNGEMENT REQUESTS
-- ============================================

INSERT INTO "ExpungementRequest" (id, "citizenId", "userId", status, description) VALUES
('exp_alex', 'cit_alex_rivera', 'cmlze2m4s00008qjtsfe9cunr', 'PENDING', 'Requesting expungement of written warning for speeding. First and only offense. Clean record since then. Currently enrolled in college.');

-- Link to the record
UPDATE "Record" SET "expungementRequestId" = 'exp_alex' WHERE id = 'rec_warn_alex';

-- ============================================
-- NAME CHANGE REQUESTS
-- ============================================

INSERT INTO "NameChangeRequest" (id, "citizenId", "userId", "newName", "newSurname", description, status) VALUES
(gen_random_uuid()::text, 'cit_jane_smith', 'cmlze2m4s00008qjtsfe9cunr', 'Jane', 'Rodriguez', 'Requesting name change following marriage. Marriage certificate available for verification.', 'PENDING'),
(gen_random_uuid()::text, 'cit_alex_rivera', 'cmlze2m4s00008qjtsfe9cunr', 'Alejandro', 'Rivera', 'Requesting legal name change from Alex to Alejandro. Birth certificate shows full legal name.', 'ACCEPTED');

-- ============================================
-- NOTIFICATIONS
-- ============================================

INSERT INTO "Notification" (id, "userId", title, description) VALUES
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'Warrant Issued', 'An active warrant has been issued for Carlos Garcia.'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'Expungement Request', 'Alex Rivera has submitted an expungement request for review.'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'Name Change Request', 'Jane Smith has requested a name change to Jane Rodriguez.'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'New Business Registration', 'SkyHigh Aviation has been registered and approved.'),
(gen_random_uuid()::text, 'cmlze2m4s00008qjtsfe9cunr', 'Vehicle Reported Stolen', 'A vehicle (FAS 777 - Orange Chevrolet Camaro) has been reported stolen.');

-- ============================================
-- CUSTOM FIELDS
-- ============================================

INSERT INTO "CustomField" (id, name, "citizenEditable", category) VALUES
('cf_ssn', 'Social Security Number', false, 'CITIZEN'),
('cf_emergency_contact', 'Emergency Contact', true, 'CITIZEN'),
('cf_vin_location', 'VIN Location', false, 'VEHICLE'),
('cf_mods', 'Vehicle Modifications', true, 'VEHICLE'),
('cf_wpn_condition', 'Weapon Condition', false, 'WEAPON');

INSERT INTO "CustomFieldValue" (id, value, "fieldId") VALUES
('cfv_john_ssn', '***-**-1234', 'cf_ssn'),
('cfv_john_emerg', 'Jane Smith - 555-0102', 'cf_emergency_contact'),
('cfv_marcus_ssn', '***-**-5678', 'cf_ssn'),
('cfv_crown_vin', 'Driver side door jamb', 'cf_vin_location'),
('cfv_camaro_mods', 'Aftermarket exhaust, tinted windows, lowered suspension', 'cf_mods'),
('cfv_glock_cond', 'Good - recently serviced', 'cf_wpn_condition');

-- Link custom field values to entities (A = Citizen, B = CustomFieldValue)
INSERT INTO "_CitizenToCustomFieldValue" ("A", "B") VALUES
('cit_john_doe', 'cfv_john_ssn'),
('cit_john_doe', 'cfv_john_emerg'),
('cit_marcus_johnson', 'cfv_marcus_ssn');

INSERT INTO "_CustomFieldValueToRegisteredVehicle" ("A", "B") VALUES
('cfv_crown_vin', 'rv_john_crown'),
('cfv_camaro_mods', 'rv_carlos_camaro');

INSERT INTO "_CustomFieldValueToWeapon" ("A", "B") VALUES
('cfv_glock_cond', 'wp_john_glock');

-- ============================================
-- CUSTOM ROLES
-- ============================================

INSERT INTO "CustomRole" (id, name, permissions) VALUES
('cr_senior_officer', 'Senior Officer', ARRAY['Leo', 'ViewIncidents', 'ManageIncidents', 'ViewImpoundLot', 'ManageImpoundLot', 'ViewCitizens', 'ManageCitizens']),
('cr_dispatcher', 'Lead Dispatcher', ARRAY['Dispatch', 'LiveMap', 'ViewCitizens', 'ViewIncidents']),
('cr_ems_lead', 'EMS Team Lead', ARRAY['EmsFd', 'ViewEmsFdIncidents', 'ManageEmsFdIncidents', 'ViewCitizens']);

INSERT INTO "_CustomRoleToUser" ("A", "B") VALUES
('cr_senior_officer', 'cmlze2m4s00008qjtsfe9cunr');

-- ============================================
-- DEPARTMENT VALUE LINKS
-- ============================================

INSERT INTO "DepartmentValueLink" (id, title, url, "departmentId") VALUES
(gen_random_uuid()::text, 'LSPD Standard Operating Procedures', 'https://example.com/lspd-sop', 'dv_lspd'),
(gen_random_uuid()::text, 'LSPD Training Manual', 'https://example.com/lspd-training', 'dv_lspd'),
(gen_random_uuid()::text, 'BCSO Field Guide', 'https://example.com/bcso-guide', 'dv_bcso'),
(gen_random_uuid()::text, 'SAHP Pursuit Policy', 'https://example.com/sahp-pursuit', 'dv_sahp'),
(gen_random_uuid()::text, 'EMS Protocols', 'https://example.com/ems-protocols', 'dv_ems');

-- ============================================
-- BLACKLISTED WORDS
-- ============================================

INSERT INTO "BlacklistedWord" (id, word) VALUES
(gen_random_uuid()::text, 'exploit'),
(gen_random_uuid()::text, 'cheat'),
(gen_random_uuid()::text, 'hack');

-- ============================================
-- ADDRESS FLAGS
-- ============================================

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_af_drugs', 'ADDRESS_FLAG', 'Known Drug Activity', false, 0),
('val_af_weapons', 'ADDRESS_FLAG', 'Known Weapons', false, 1),
('val_af_gang', 'ADDRESS_FLAG', 'Gang Territory', false, 2),
('val_af_warrant', 'ADDRESS_FLAG', 'Active Warrant at Address', false, 3);

-- A = Citizen, B = Value
INSERT INTO "_citizenAddressFlags" ("A", "B") VALUES
('cit_carlos_garcia', 'val_af_gang'),
('cit_carlos_garcia', 'val_af_weapons'),
('cit_carlos_garcia', 'val_af_drugs');

-- ============================================
-- VEHICLE TRIM LEVELS
-- ============================================

INSERT INTO "Value" (id, type, value, "isDefault", position) VALUES
('val_trim_base', 'VEHICLE_TRIM_LEVEL', 'Base', false, 0),
('val_trim_sport', 'VEHICLE_TRIM_LEVEL', 'Sport', false, 1),
('val_trim_luxury', 'VEHICLE_TRIM_LEVEL', 'Luxury', false, 2),
('val_trim_offroad', 'VEHICLE_TRIM_LEVEL', 'Off-Road', false, 3);

-- Link trim levels to vehicle values (A = Value, B = VehicleValue)
INSERT INTO "_vehicleTrimLevels" ("A", "B") VALUES
('val_trim_base', 'vv_civic'),
('val_trim_sport', 'vv_mustang'),
('val_trim_sport', 'vv_camaro'),
('val_trim_sport', 'vv_charger'),
('val_trim_luxury', 'vv_bmw3'),
('val_trim_luxury', 'vv_tesla3'),
('val_trim_offroad', 'vv_f150'),
('val_trim_offroad', 'vv_silverado'),
('val_trim_base', 'vv_corolla'),
('val_trim_base', 'vv_crown');

-- ============================================
-- EMS/FD INCIDENTS
-- ============================================

INSERT INTO "EmsFdIncident" (id, description, address, postal, "fireType", "creatorId", "injuriesOrFatalities", "vehicleInvolved", "isActive") VALUES
('emsfinc_1', 'Structure fire at abandoned warehouse on Elgin Ave. Two-alarm fire. Partial roof collapse.', 'Elgin Ave Warehouse District', '055', 'Structure', 'ems_sarah', true, false, false),
('emsfinc_2', 'Multi-vehicle accident on Highway 1. Three vehicles involved. Two patients with moderate injuries, one critical.', 'Highway 1, Mile Marker 45', '089', NULL, 'ems_rachel', true, true, true);

COMMIT;
-- Seed data part 3: Fill remaining data tables
BEGIN;

-- ============================================
-- RECORD RELEASES (bail posted for David Lee)
-- ============================================

INSERT INTO "RecordRelease" (id, type, "citizenId") VALUES
('rr_david', 'BAIL_POSTED', 'cit_david_lee');

UPDATE "Record" SET "releaseId" = 'rr_david' WHERE id = 'rec_arrest_david';

-- ============================================
-- BLEETER PROFILE FOLLOWS
-- ============================================

-- John follows himself? No. We only have one profile. But we can still do the system.
-- Actually let's just note that more profiles would be needed for follows.
-- Skip - requires multiple users with profiles.

-- ============================================
-- LINK CALLS TO DIVISIONS
-- ============================================

INSERT INTO "_Call911ToDivisionValue" ("A", "B") VALUES
('call_1', 'divv_patrol'),
('call_2', 'divv_patrol'),
('call_2', 'divv_k9'),
('call_3', 'divv_traffic'),
('call_3', 'divv_rescue'),
('call_4', 'divv_patrol'),
('call_5', 'divv_k9');

-- ============================================
-- LINK CALLS TO INCIDENTS
-- ============================================

INSERT INTO "_Call911ToLeoIncident" ("A", "B") VALUES
('call_1', 'inc_1'),
('call_2', 'inc_1'),
('call_3', 'inc_2');

-- ============================================
-- LINK DIVISIONS TO EMERGENCY VEHICLES
-- ============================================

INSERT INTO "_DivisionValueToEmergencyVehicleValue" ("A", "B") VALUES
('divv_patrol', 'evv_crown_patrol'),
('divv_patrol', 'evv_charger_patrol'),
('divv_patrol', 'evv_explorer_patrol'),
('divv_traffic', 'evv_motorcycle'),
('divv_traffic', 'evv_charger_patrol'),
('divv_k9', 'evv_tahoe_patrol'),
('divv_swat', 'evv_explorer_patrol'),
('divv_rescue', 'evv_ambulance'),
('divv_rescue', 'evv_firetruck');

-- ============================================
-- LINK OFFICER RANKS TO DEPARTMENTS
-- ============================================

INSERT INTO "_officerRankDepartments" ("A", "B") VALUES
('dv_lspd', 'val_rank_chief'),
('dv_lspd', 'val_rank_captain'),
('dv_lspd', 'val_rank_lieutenant'),
('dv_lspd', 'val_rank_sergeant'),
('dv_lspd', 'val_rank_corporal'),
('dv_lspd', 'val_rank_officer'),
('dv_bcso', 'val_rank_chief'),
('dv_bcso', 'val_rank_sergeant'),
('dv_bcso', 'val_rank_corporal'),
('dv_bcso', 'val_rank_deputy'),
('dv_sahp', 'val_rank_captain'),
('dv_sahp', 'val_rank_lieutenant'),
('dv_sahp', 'val_rank_trooper'),
('dv_ems', 'val_rank_captain'),
('dv_ems', 'val_rank_officer'),
('dv_lsfd', 'val_rank_captain'),
('dv_lsfd', 'val_rank_officer');

-- ============================================
-- LINK TRIM LEVELS TO REGISTERED VEHICLES
-- ============================================

INSERT INTO "_registeredVehicleTrimLevels" ("A", "B") VALUES
('rv_john_crown', 'val_trim_base'),
('rv_jane_mustang', 'val_trim_sport'),
('rv_marcus_charger', 'val_trim_sport'),
('rv_sarah_civic', 'val_trim_base'),
('rv_david_corolla', 'val_trim_base'),
('rv_emily_tesla', 'val_trim_luxury'),
('rv_carlos_camaro', 'val_trim_sport'),
('rv_alex_bmw', 'val_trim_luxury'),
('rv_john_f150', 'val_trim_offroad'),
('rv_john_silverado', 'val_trim_offroad'),
('rv_mike_tahoe', 'val_trim_offroad');

-- ============================================
-- WEAPON FLAGS
-- ============================================

-- A = Value, B = Weapon
INSERT INTO "_weaponFlags" ("A", "B") VALUES
('val_wf_evidence', 'wp_john_ar15');

-- ============================================
-- LEO WHITELIST STATUS (for whitelisted depts)
-- ============================================

-- Make SWAT/Detective divisions require whitelist
UPDATE "DepartmentValue" SET whitelisted = true WHERE id = 'dv_sahp';

INSERT INTO "LeoWhitelistStatus" (id, status, "departmentId") VALUES
('lws_mike_sahp', 'ACCEPTED', 'dv_sahp');

UPDATE "Officer" SET "whitelistStatusId" = 'lws_mike_sahp' WHERE id = 'off_mike_sahp';

COMMIT;
