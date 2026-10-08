-- =========================================================
-- ACXIOMCRM DATABASE SEED DATA
-- Realistic enterprise data for development, testing, and evaluation
-- =========================================================

USE acxiomcrm;

-- Temporarily disable foreign key checks for clean re-seeding if needed
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE customer_requests;
TRUNCATE TABLE activities;
TRUNCATE TABLE followups;
TRUNCATE TABLE opportunities;
TRUNCATE TABLE leads;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE system_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. SEED ROLES
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'System Administrator with full organizational and security access'),
(2, 'MANAGER', 'Sales & Operations Manager overseeing team performance and pipelines'),
(3, 'SALES_EXECUTIVE', 'Sales Executive managing assigned leads, customers, and opportunities'),
(4, 'CUSTOMER', 'External Customer portal user accessing self-service relationship center');

-- 2. SEED USERS
-- Passwords:
-- admin@acxiomcrm.com -> Admin@123
-- manager@acxiomcrm.com -> Manager@123
-- sales.alex@acxiomcrm.com -> Sales@123
-- sales.sarah@acxiomcrm.com -> Sales@123
-- customer.robert@cloudscale.io -> Customer@123
-- customer.elena@nexusfin.com -> Customer@123

INSERT INTO users (user_id, role_id, first_name, last_name, email, phone, password_hash, status, department, created_at) VALUES
(1, 1, 'Alexander', 'Vance', 'admin@acxiomcrm.com', '+1-555-0101', '$2a$10$J5RbC2OYB4nufefv0jRxCuHXCKMFk34Pp8Abi220EObmPYOetIRXC', 'ACTIVE', 'Executive Leadership', NOW()),
(2, 2, 'David', 'Miller', 'manager@acxiomcrm.com', '+1-555-0102', '$2a$10$YL1cfw7xQf4jBDKPiRrw4uXF0XKYQzbQlpMfUOGRnOLet5MWtKx9K', 'ACTIVE', 'Sales Management', NOW()),
(3, 3, 'Alex', 'Turner', 'sales.alex@acxiomcrm.com', '+1-555-0103', '$2a$10$/k7T0ukGlhPW0CQVI9ilKOfb79UPVJpUcTHCU2xoRZ.TcglOHKyiy', 'ACTIVE', 'Enterprise Sales', NOW()),
(4, 3, 'Sarah', 'Jenkins', 'sales.sarah@acxiomcrm.com', '+1-555-0104', '$2a$10$/k7T0ukGlhPW0CQVI9ilKOfb79UPVJpUcTHCU2xoRZ.TcglOHKyiy', 'ACTIVE', 'SMB Sales', NOW()),
(5, 4, 'Robert', 'Sterling', 'customer.robert@cloudscale.io', '+1-555-0105', '$2a$10$R7R.j2qeUkokBau5XqxcsOe9z4hoKWlUIOWyCF48pzxwbb95gpJzG', 'ACTIVE', 'Client Services', NOW()),
(6, 4, 'Elena', 'Rostova', 'customer.elena@nexusfin.com', '+1-555-0106', '$2a$10$R7R.j2qeUkokBau5XqxcsOe9z4hoKWlUIOWyCF48pzxwbb95gpJzG', 'ACTIVE', 'Client Services', NOW());

-- 3. SEED CUSTOMERS (12 companies)
INSERT INTO customers (customer_id, customer_code, customer_name, email, phone, company_name, address, city, state, postal_code, country, status, user_id, created_by, assigned_to, created_at) VALUES
(1, 'CUST-1001', 'Robert Sterling', 'robert@cloudscale.io', '+1-415-555-0111', 'CloudScale Technologies', '100 Market St, Suite 400', 'San Francisco', 'CA', '94105', 'USA', 'ACTIVE', 5, 1, 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(2, 'CUST-1002', 'Elena Rostova', 'elena@nexusfin.com', '+1-212-555-0122', 'Nexus Financial', '45 Wall Street, Fl 18', 'New York', 'NY', '10005', 'USA', 'ACTIVE', 6, 2, 3, DATE_SUB(NOW(), INTERVAL 40 DAY)),
(3, 'CUST-1003', 'Marcus Thorne', 'marcus@apexbio.com', '+1-617-555-0133', 'Apex BioPharma', '250 Technology Square', 'Cambridge', 'MA', '02139', 'USA', 'ACTIVE', NULL, 2, 4, DATE_SUB(NOW(), INTERVAL 35 DAY)),
(4, 'CUST-1004', 'Clara Oswald', 'clara@vertexlog.com', '+1-312-555-0144', 'Vertex Logistics', '800 W Madison St', 'Chicago', 'IL', '60607', 'USA', 'ACTIVE', NULL, 1, 4, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(5, 'CUST-1005', 'Kenji Sato', 'kenji@quantumrob.io', '+1-206-555-0155', 'Quantum Robotics', '500 Pike Street', 'Seattle', 'WA', '98101', 'USA', 'ACTIVE', NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 28 DAY)),
(6, 'CUST-1006', 'Victoria Vance', 'victoria@blueskymedia.co', '+1-310-555-0166', 'BlueSky Media Group', '9000 Sunset Blvd', 'Los Angeles', 'CA', '90069', 'USA', 'ACTIVE', NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(7, 'CUST-1007', 'Arthur Pendelton', 'arthur@horizonretail.com', '+1-512-555-0177', 'Horizon Retailers', '120 Congress Ave', 'Austin', 'TX', '78701', 'USA', 'ACTIVE', NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(8, 'CUST-1008', 'Nadia Chen', 'nadia@cobaltsec.net', '+1-703-555-0188', 'Cobalt Cybersecurity', '1800 Tysons Blvd', 'McLean', 'VA', '22102', 'USA', 'ACTIVE', NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(9, 'CUST-1009', 'Liam O''Connor', 'liam@pulseanalytics.ai', '+1-303-555-0199', 'Pulse Analytics', '1600 17th St', 'Denver', 'CO', '80202', 'USA', 'ACTIVE', NULL, 2, 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(10, 'CUST-1010', 'Sophia Lorenzi', 'sophia@summitconsult.org', '+1-404-555-0200', 'Summit Strategy Group', '3344 Peachtree Rd NE', 'Atlanta', 'GA', '30326', 'USA', 'ACTIVE', NULL, 1, 4, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(11, 'CUST-1011', 'Devon Ward', 'devon@radianthealth.org', '+1-615-555-0211', 'Radiant Health Systems', '2000 West End Ave', 'Nashville', 'TN', '37203', 'USA', 'ACTIVE', NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(12, 'CUST-1012', 'Hannah Abbot', 'hannah@omnicorpglobal.com', '+1-713-555-0222', 'OmniCorp Industrial', '1000 Louisiana St', 'Houston', 'TX', '77002', 'USA', 'INACTIVE', NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- 4. SEED LEADS (18 leads)
INSERT INTO leads (lead_id, lead_code, lead_name, email, phone, company_name, source, status, priority, expected_value, notes, created_by, assigned_to, created_at) VALUES
(1, 'LEAD-2001', 'Jordan Hayes', 'jordan@strataenergy.com', '+1-214-555-1001', 'Strata Energy Solutions', 'Website', 'NEW', 'HOT', 85000.00, 'Interested in automated sales pipeline tracking for 200 users', 1, 3, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 'LEAD-2002', 'Maya Lin', 'maya@prismdesign.io', '+1-415-555-1002', 'Prism Interactive Design', 'Referral', 'CONTACTED', 'HOT', 45000.00, 'Referred by CloudScale. Looking for customer portal capabilities', 2, 3, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(3, 'LEAD-2003', 'Derek Zhang', 'derek@solarixpower.com', '+1-602-555-1003', 'Solarix Renewable Power', 'Partner', 'QUALIFIED', 'HOT', 120000.00, 'Enterprise tier evaluation with custom role hierarchy requirements', 2, 4, DATE_SUB(NOW(), INTERVAL 16 DAY)),
(4, 'LEAD-2004', 'Rachel Green', 'rachel@monarchfashion.com', '+1-212-555-1004', 'Monarch Luxury Apparel', 'Website', 'CONTACTED', 'WARM', 38000.00, 'Demo requested for omni-channel customer record synchronization', 3, 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(5, 'LEAD-2005', 'Carlos Mendoza', 'carlos@avionlogistics.mx', '+1-786-555-1005', 'Avion Cross-Border Freight', 'Event', 'QUALIFIED', 'WARM', 65000.00, 'Met at Global SaaS Expo. Scheduled for proposal review', 4, 4, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(6, 'LEAD-2006', 'Fiona Gallagher', 'fiona@emeraldcapital.ie', '+1-617-555-1006', 'Emerald Financial Advisors', 'Cold Outreach', 'NEW', 'WARM', 50000.00, 'Inbound response to outbound compliance email campaign', 1, 4, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(7, 'LEAD-2007', 'Tariq Al-Mansoor', 'tariq@crescentinfra.ae', '+1-202-555-1007', 'Crescent Infrastructure', 'Website', 'CONTACTED', 'HOT', 95000.00, 'High priority inquiry for multi-region CRM deployment', 2, 3, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(8, 'LEAD-2008', 'Samantha Ray', 'samantha@biogenixlab.com', '+1-858-555-1008', 'BioGenix Diagnostics', 'Website', 'NEW', 'COLD', 25000.00, 'Downloaded product whitepaper on HIPAA-ready data models', 3, 3, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(9, 'LEAD-2009', 'Nathaniel Drake', 'nathaniel@unchartedtravel.co', '+1-503-555-1009', 'Uncharted Luxury Expeditions', 'Social Media', 'UNQUALIFIED', 'COLD', 12000.00, 'Company size below enterprise threshold. Forwarded to partner pool', 4, 4, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(10, 'LEAD-2010', 'Zoe Kravitz', 'zoe@hyperionstudios.com', '+1-323-555-1010', 'Hyperion Media Labs', 'Referral', 'QUALIFIED', 'HOT', 78000.00, 'Looking to migrate 80,000 customer contacts from legacy CRM', 2, 4, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(11, 'LEAD-2011', 'Gary Oldman', 'gary@britanniaconsulting.uk', '+1-212-555-1011', 'Britannia Advisory Ltd', 'Event', 'LOST', 'COLD', 40000.00, 'Budget deferred to next fiscal calendar', 3, 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 'LEAD-2012', 'Ingrid Bergman', 'ingrid@nordicfintech.se', '+1-646-555-1012', 'Nordic Payment Rails', 'Website', 'CONTACTED', 'WARM', 60000.00, 'Initial discovery call held. Follow-up meeting required', 3, 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(13, 'LEAD-2013', 'Ethan Hunt', 'ethan@syndicatesecurity.org', '+1-703-555-1013', 'Syndicate Cyber Defense', 'Cold Outreach', 'NEW', 'HOT', 110000.00, 'Requires audit trail and tamper-proof logging proof-of-concept', 1, 4, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(14, 'LEAD-2014', 'Chloe Sullivan', 'chloe@metropolisdaily.com', '+1-312-555-1014', 'Metropolis Media Network', 'Website', 'QUALIFIED', 'WARM', 52000.00, 'Reviewing SaaS SLA terms and integration webhooks', 4, 4, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 'LEAD-2015', 'Lucas Scott', 'lucas@treehilltimber.com', '+1-919-555-1015', 'Tree Hill Forest Products', 'Referral', 'CONTACTED', 'WARM', 34000.00, 'Evaluating CRM for distributor and customer tracking', 3, 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 'LEAD-2016', 'Grace Hopper', 'grace@compilersys.tech', '+1-617-555-1016', 'Compiler Systems Corp', 'Website', 'NEW', 'HOT', 140000.00, 'Urgent rollout requirement across 4 subsidiaries', 2, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(17, 'LEAD-2017', 'Victor Fries', 'victor@cryocore.de', '+1-212-555-1017', 'CryoCore Medical', 'Partner', 'NEW', 'WARM', 48000.00, 'Partner referral from German branch office', 4, 4, NOW()),
(18, 'LEAD-2018', 'Anita Blake', 'anita@animatorsinc.com', '+1-314-555-1018', 'Animators Digital Studio', 'Social Media', 'CONTACTED', 'COLD', 22000.00, 'Exploring entry tier CRM package', 3, 4, NOW());

-- 5. SEED OPPORTUNITIES (12 opportunities)
-- Stages: QUALIFICATION, PROPOSAL, NEGOTIATION, WON, LOST
INSERT INTO opportunities (opportunity_id, opportunity_code, opportunity_name, customer_id, lead_id, amount, stage, probability, expected_close_date, status, notes, created_by, assigned_to, created_at) VALUES
(1, 'OPP-3001', 'CloudScale Multi-Seat Enterprise Rollout', 1, NULL, 125000.00, 'WON', 100, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'WON', 'Closed annual enterprise license contract for 120 users', 1, 3, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 'OPP-3002', 'NexusFin Compliance & Portal Suite', 2, NULL, 95000.00, 'NEGOTIATION', 85, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'OPEN', 'Final terms and DPA review in progress with legal counsel', 2, 3, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(3, 'OPP-3003', 'Apex BioPharma Clinical Trial CRM', 3, NULL, 80000.00, 'PROPOSAL', 60, DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 'OPEN', 'RFP submitted. Presentation scheduled for next Tuesday', 2, 4, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(4, 'OPP-3004', 'Vertex Fleet Tracking Customer Hub', 4, NULL, 62000.00, 'QUALIFICATION', 30, DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 'OPEN', 'Discovery phase completed with Operations Director', 1, 4, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(5, 'OPP-3005', 'Quantum AI Automation Pipeline', 5, NULL, 150000.00, 'NEGOTIATION', 75, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'OPEN', 'Commercial negotiation on multi-year discount structure', 3, 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(6, 'OPP-3006', 'BlueSky Creator Management Platform', 6, NULL, 48000.00, 'WON', 100, DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 'WON', 'Signed 24-month SaaS contract', 3, 3, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(7, 'OPP-3007', 'Horizon Retail POS & Loyalty Connect', 7, NULL, 110000.00, 'PROPOSAL', 50, DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 'OPEN', 'Proposal draft shared with VP of Retail Merchandising', 4, 4, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(8, 'OPP-3008', 'Cobalt SOC Security Workflow Integration', 8, NULL, 72000.00, 'LOST', 0, DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 'LOST', 'Competitor had existing on-premise hardware tie-in', 4, 4, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(9, 'OPP-3009', 'Pulse Analytics AI Insights Add-on', 9, NULL, 42000.00, 'PROPOSAL', 55, DATE_ADD(CURRENT_DATE, INTERVAL 18 DAY), 'OPEN', 'Adding predictive churn dashboards into standard tier', 2, 3, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(10, 'OPP-3010', 'Summit Strategy Advisory CRM Engine', 10, NULL, 58000.00, 'QUALIFICATION', 25, DATE_ADD(CURRENT_DATE, INTERVAL 35 DAY), 'OPEN', 'Initial requirements gathering workshops underway', 1, 4, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(11, 'OPP-3011', 'Radiant Health Telehealth Lead Gateway', 11, NULL, 88000.00, 'PROPOSAL', 65, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'OPEN', 'Technical architectural validation completed successfully', 3, 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(12, 'OPP-3012', 'OmniCorp Supply Chain Support Module', 12, NULL, 35000.00, 'LOST', 0, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), 'LOST', 'Deferred indefinitely due to internal restructuring', 4, 4, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 6. SEED FOLLOW-UPS (16 follow-ups)
-- Dates: today, future, completed, missed
INSERT INTO followups (followup_id, customer_id, lead_id, opportunity_id, followup_date, followup_type, remarks, status, created_by, assigned_to, created_at) VALUES
(1, 1, NULL, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), 'MEETING', 'Executive quarterly business review and expansion roadmap', 'PLANNED', 1, 3, NOW()),
(2, 2, NULL, 2, DATE_ADD(NOW(), INTERVAL 4 HOUR), 'CALL', 'Review redlined legal contract clauses with Elena', 'PLANNED', 2, 3, NOW()),
(3, 3, NULL, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), 'DEMO', 'Product demo for technical advisory committee', 'PLANNED', 2, 4, NOW()),
(4, NULL, 1, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 'CALL', 'Initial qualification call with Jordan Hayes regarding 200 seat rollout', 'PLANNED', 1, 3, NOW()),
(5, NULL, 3, NULL, DATE_ADD(NOW(), INTERVAL 2 DAY), 'MEETING', 'Solar renewable CRM architecture scoping session', 'PLANNED', 2, 4, NOW()),
(6, 5, NULL, 5, DATE_ADD(NOW(), INTERVAL 3 DAY), 'CALL', 'Follow up on discounted multi-year quote with Kenji', 'PLANNED', 3, 3, NOW()),
(7, 7, NULL, 7, DATE_ADD(NOW(), INTERVAL 4 DAY), 'EMAIL', 'Send updated retail POS workflow integration documentation', 'PLANNED', 4, 4, NOW()),
(8, NULL, 7, NULL, DATE_ADD(NOW(), INTERVAL 5 DAY), 'MEETING', 'Global infrastructure multi-region compliance discussion', 'PLANNED', 2, 3, NOW()),
(9, 1, NULL, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'MEETING', 'Kickoff call after contract signing with CloudScale dev leads', 'COMPLETED', 1, 3, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(10, 2, NULL, 2, DATE_SUB(NOW(), INTERVAL 7 DAY), 'DEMO', 'Security and customer portal walkthrough demo', 'COMPLETED', 2, 3, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(11, 6, NULL, 6, DATE_SUB(NOW(), INTERVAL 5 DAY), 'CALL', 'Finalize payment terms for 24-month BlueSky agreement', 'COMPLETED', 3, 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 4, NULL, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), 'EMAIL', 'Shared case study on logistics customer management', 'COMPLETED', 1, 4, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(13, NULL, 4, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 'CALL', 'Follow-up regarding apparel seasonal catalog requirements', 'MISSED', 3, 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(14, NULL, 5, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), 'EMAIL', 'Cross-border logistics proposal follow-up', 'MISSED', 4, 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15, 8, NULL, 8, DATE_SUB(NOW(), INTERVAL 8 DAY), 'CALL', 'Competitive analysis check with Cobalt Security team', 'CANCELLED', 4, 4, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(16, 9, NULL, 9, DATE_ADD(NOW(), INTERVAL 2 DAY), 'CALL', 'Check in on Pulse Analytics pilot trial results', 'PLANNED', 2, 3, NOW());

-- 7. SEED ACTIVITIES (22 activities)
INSERT INTO activities (activity_id, activity_type, subject, description, activity_date, customer_id, lead_id, opportunity_id, status, created_by, assigned_to, created_at) VALUES
(1, 'MEETING', 'Quarterly Review with CloudScale', 'Held comprehensive QBR discussing platform utilization and SLA metrics.', DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, 1, 'COMPLETED', 1, 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'CALL', 'Contract Redline Discussion', 'Addressed data residency queries with Nexus Financial legal officers.', DATE_SUB(NOW(), INTERVAL 1 DAY), 2, NULL, 2, 'COMPLETED', 2, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'MEETING', 'Platform Security Architecture Demo', 'Demonstrated RBAC and audit logging features to Apex BioPharma CIO.', DATE_SUB(NOW(), INTERVAL 3 DAY), 3, NULL, 3, 'COMPLETED', 2, 4, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 'EMAIL', 'Sent Custom Proposal PDF', 'Dispatched proposal with tiered licensing breakdown for Quantum Robotics.', DATE_SUB(NOW(), INTERVAL 4 DAY), 5, NULL, 5, 'COMPLETED', 3, 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 'CALL', 'Discovery Call with Jordan Hayes', 'Discussed requirements for Strata Energy 200 seat deployment.', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 1, NULL, 'COMPLETED', 1, 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 'MEETING', 'Onboarding Strategy Session', 'Met with BlueSky Media team to initiate customer data mapping.', DATE_SUB(NOW(), INTERVAL 6 DAY), 6, NULL, 6, 'COMPLETED', 3, 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7, 'TASK', 'Prepare Security Whitepaper', 'Compiled SOC2 summary documentation for Cobalt Security team.', DATE_SUB(NOW(), INTERVAL 7 DAY), 8, NULL, 8, 'COMPLETED', 4, 4, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(8, 'EMAIL', 'Introductory Outreach Email', 'Contacted Solarix Power regarding renewable energy CRM templates.', DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, 3, NULL, 'COMPLETED', 2, 4, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(9, 'CALL', 'Feedback on Trial Version', 'Received positive initial feedback on workflow automation from Pulse.', DATE_SUB(NOW(), INTERVAL 9 DAY), 9, NULL, 9, 'COMPLETED', 2, 3, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(10, 'TASK', 'Update Pipeline Projections', 'Adjusted Q4 revenue forecasts based on recent enterprise win rates.', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, NULL, 'COMPLETED', 2, 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(11, 'MEETING', 'Weekly Sales Standup', 'Reviewed team lead conversion rates and hot deals with David Miller.', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, NULL, 'COMPLETED', 2, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 'EMAIL', 'Follow-up on Proposal Terms', 'Followed up with Horizon Retail on hardware point-of-sale specs.', DATE_SUB(NOW(), INTERVAL 2 DAY), 7, NULL, 7, 'COMPLETED', 4, 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(13, 'CALL', 'Inbound Lead Triage Call', 'Verified contact details and company size for Compiler Systems lead.', DATE_SUB(NOW(), INTERVAL 12 HOUR), NULL, 16, NULL, 'COMPLETED', 2, 3, NOW()),
(14, 'MEETING', 'Enterprise Architecture Review', 'Discussed high availability deployment options with Vertex Logistics.', DATE_SUB(NOW(), INTERVAL 11 DAY), 4, NULL, 4, 'COMPLETED', 1, 4, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(15, 'TASK', 'Sanitize Customer Contact Records', 'Deduplicated historical contact records from old CSV import.', DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, NULL, NULL, 'COMPLETED', 1, 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(16, 'CALL', 'Introductory Chat with Maya Lin', 'Discussed Prism Interactive team structure and role permission needs.', DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 2, NULL, 'COMPLETED', 2, 3, DATE_SUB(NOW(), INTERVAL 13 DAY)),
(17, 'EMAIL', 'Compliance Checklist Dispatch', 'Emailed SOC2 Type II report to Syndicate Cyber Defense evaluation lead.', DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 13, NULL, 'COMPLETED', 1, 4, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(18, 'MEETING', 'Product Roadmap Preview', 'Briefed Radiant Health stakeholders on upcoming patient messaging bridge.', DATE_SUB(NOW(), INTERVAL 15 DAY), 11, NULL, 11, 'COMPLETED', 3, 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(19, 'CALL', 'Check-in on Renewal Timeline', 'Ensured CloudScale is on track for automated annual renewal.', DATE_SUB(NOW(), INTERVAL 16 DAY), 1, NULL, 1, 'COMPLETED', 1, 3, DATE_SUB(NOW(), INTERVAL 16 DAY)),
(20, 'TASK', 'Audit Log Security Review', 'Conducted monthly security verification of administrator activities.', DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, NULL, NULL, 'COMPLETED', 1, 1, DATE_SUB(NOW(), INTERVAL 17 DAY)),
(21, 'CALL', 'Discovery Call with Chloe Sullivan', 'Analyzed publishing pipeline volume and editorial user count.', DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 14, NULL, 'COMPLETED', 4, 4, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(22, 'TASK', 'Configure Custom Export Formats', 'Set up CSV templates for automated weekly executive reports.', DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, NULL, NULL, 'COMPLETED', 2, 2, DATE_SUB(NOW(), INTERVAL 19 DAY));

-- 8. SEED CUSTOMER REQUESTS (Customer Portal)
INSERT INTO customer_requests (request_id, customer_id, user_id, subject, message, priority, status, assigned_to, response, responded_at, created_at) VALUES
(1, 1, 5, 'Request for Additional User Licenses', 'We are adding 15 new engineers to our department. Could you provide a quote for expanding our subscription?', 'HIGH', 'RESOLVED', 3, 'Hi Robert, I have generated a quote for 15 additional seats with the enterprise tier discount. It is attached in your portal.', NOW(), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 5, 'API Webhook Integration Support', 'We want to sync our internal deployment triggers with AcxiomCRM opportunities via webhook. Do you have documentation?', 'MEDIUM', 'IN_PROGRESS', 3, 'Hello! Our technical documentation has been sent over and our solutions architect is available for a 30m call.', NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 6, 'Annual SOC2 Security Report Download', 'Our compliance team needs the updated SOC2 Type II compliance audit packet for our vendor risk review.', 'URGENT', 'RESOLVED', 3, 'Hi Elena, the latest SOC2 report has been verified and delivered to your compliance inbox.', NOW(), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 2, 6, 'Schedule Quarterly Review Meeting', 'We would like to book our Q4 review meeting to discuss new branch rollout.', 'MEDIUM', 'OPEN', 3, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(5, 1, 5, 'Invoice Billing Currency Inquiry', 'Can we adjust the upcoming renewal invoice to settle in EUR instead of USD?', 'LOW', 'OPEN', 3, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 9. SEED NOTIFICATIONS
INSERT INTO notifications (notification_id, user_id, title, message, type, is_read, link, created_at) VALUES
(1, 1, 'System Health Optimal', 'All microservices and MySQL connection pool operating within normal latency (<15ms).', 'SUCCESS', FALSE, '/admin/settings', NOW()),
(2, 1, 'New User Registered', 'Sarah Jenkins was granted role SALES_EXECUTIVE.', 'INFO', TRUE, '/admin/users', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 'Audit Log Milestone', 'Over 1,000 security and transaction audit entries recorded.', 'INFO', FALSE, '/admin/audit', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 2, 'High-Value Opportunity Added', 'Opportunity "Quantum AI Automation Pipeline" valued at $150,000 entered Negotiation stage.', 'WARNING', FALSE, '/opportunities', NOW()),
(5, 2, 'Monthly Team Conversion Surge', 'Team conversion rate reached 34.2%, exceeding Q3 target.', 'SUCCESS', FALSE, '/reports', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 3, 'Today''s Follow-Up Scheduled', 'You have 2 client calls scheduled today: CloudScale and Nexus Financial.', 'INFO', FALSE, '/followups', NOW()),
(7, 3, 'Hot Lead Assigned', 'Hot Lead "Jordan Hayes" from Strata Energy ($85,000) assigned to your queue.', 'WARNING', FALSE, '/leads', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 4, 'Proposal Stage Milestone', 'Apex BioPharma proposal submitted and under formal executive review.', 'INFO', FALSE, '/opportunities', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 5, 'Support Request Answered', 'Your inquiry regarding additional user licenses has been resolved by Alex Turner.', 'SUCCESS', FALSE, '/customer/requests', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 6, 'Upcoming Legal Review Call', 'Call scheduled with Alex Turner regarding contract terms today.', 'INFO', FALSE, '/dashboard', NOW());

-- 10. SEED SYSTEM SETTINGS
INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES
('APP_NAME', 'ACXIOMCRM', 'GENERAL', 'Application branding title'),
('ORGANIZATION_NAME', 'Acxiom Enterprise Technologies Inc.', 'GENERAL', 'Legal operating company name'),
('DEFAULT_CURRENCY', 'USD', 'FINANCE', 'Default currency denomination for pipeline calculations'),
('MAX_LOGIN_ATTEMPTS', '5', 'SECURITY', 'Failed consecutive logins allowed before 15-minute lockout'),
('LOCKOUT_DURATION_MINUTES', '15', 'SECURITY', 'Account lockout duration upon exceeding failed logins'),
('SESSION_TIMEOUT_HOURS', '24', 'SECURITY', 'JSON Web Token active session lifespan'),
('AUDIT_LOG_RETENTION_DAYS', '365', 'SECURITY', 'Duration to retain immutable audit log history'),
('LEAD_AUTO_QUALIFY_THRESHOLD', '50000', 'SALES', 'Threshold value for auto-tagging hot prospect leads');

-- 11. SEED AUDIT LOGS
INSERT INTO audit_logs (audit_log_id, user_id, action, entity_name, record_id, old_value, new_value, ip_address, user_agent, created_at) VALUES
(1, 1, 'LOGIN', 'USER', '1', NULL, JSON_OBJECT('status', 'SUCCESS', 'method', 'EMAIL_PASSWORD'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 1, 'CREATE', 'CUSTOMER', '1', NULL, JSON_OBJECT('name', 'CloudScale Technologies', 'email', 'robert@cloudscale.io'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 2, 'CREATE', 'OPPORTUNITY', '1', NULL, JSON_OBJECT('name', 'CloudScale Multi-Seat Enterprise Rollout', 'amount', 125000), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 3, 'UPDATE', 'OPPORTUNITY', '1', JSON_OBJECT('stage', 'NEGOTIATION'), JSON_OBJECT('stage', 'WON'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 1, 'ROLE_CHANGE', 'USER', '3', JSON_OBJECT('role', 'SALES_EXECUTIVE'), JSON_OBJECT('role', 'SALES_EXECUTIVE', 'department', 'Enterprise Sales'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(6, 2, 'CREATE', 'LEAD', '1', NULL, JSON_OBJECT('lead_name', 'Jordan Hayes', 'expected_value', 85000), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 3, 'CREATE', 'FOLLOWUP', '1', NULL, JSON_OBJECT('type', 'MEETING', 'customer_id', 1), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8, 1, 'PASSWORD_RESET', 'USER', '4', NULL, JSON_OBJECT('initiated_by', 'ADMIN', 'target_user', 'sales.sarah@acxiomcrm.com'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9, 2, 'UPDATE', 'LEAD', '3', JSON_OBJECT('status', 'NEW'), JSON_OBJECT('status', 'QUALIFIED'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 1, 'LOGIN', 'USER', '1', NULL, JSON_OBJECT('status', 'SUCCESS', 'method', 'EMAIL_PASSWORD'), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW());
