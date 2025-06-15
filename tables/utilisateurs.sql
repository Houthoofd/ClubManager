-- Création de la table des utilisateurs avec la clé étrangère pour le genre et le tarif
-- Table utilisateurs
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,  -- Unicité de l'email
    gender INT,  -- Clé étrangère pour le genre
    date_of_birth DATE NOT NULL,
    status_id INT DEFAULT 1,  -- Clé étrangère pour le statut
    grade INT DEFAULT 1,  -- Référence à l'ID de la table `grades`
    abonnement INT,  -- Clé étrangère pour le tarif (plan)
    
    -- Ajout des clés étrangères
    FOREIGN KEY (gender) REFERENCES genres(id),
    FOREIGN KEY (abonnement) REFERENCES plans_tarifaires(id),
    FOREIGN KEY (grade) REFERENCES grades(id),
    FOREIGN KEY (status_id) REFERENCES status(id)  -- Clé étrangère vers la table `status`
);

insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (1, 'Cinéma', 'Burkinshaw', 'sburkinshaw0@reference.com', 1, '2002-08-09', 3, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (2, 'Thérèsa', 'Farrall', 'hfarrall1@youku.com', 1, '1992-12-03', 1, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (3, 'Mélanie', 'Paolacci', 'opaolacci2@indiegogo.com', 1, '1995-09-26', 4, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (4, 'Jú', 'Farguhar', 'mfarguhar3@biblegateway.com', 'Genderfluid', '1967-06-06', 3, 1);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (5, 'Mélina', 'Dyter', 'cdyter4@last.fm', 1, '1970-08-20', 3, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (6, 'Andrée', 'Scripture', 'jscripture5@slashdot.org', 1, '1997-12-18', 4, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (7, 'Estée', 'Velte', 'mvelte6@soundcloud.com', 2, '1981-07-03', 3, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (8, 'Rachèle', 'Hame', 'jhame7@businesswire.com', 1, '1986-06-23', 4, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (9, 'Maïlis', 'Bracer', 'tbracer8@cloudflare.com', 2, '2011-09-13', 3, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (10, 'Cécilia', 'Ick', 'dick9@jigsy.com', 2, '1972-07-13', 4, 8);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (11, 'Pò', 'Venart', 'evenarta@nhs.uk', 2, '2003-06-04', 3, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (12, 'Dafnée', 'Woolston', 'mwoolstonb@skype.com', 2, '1993-03-24', 4, 8);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (13, 'Danièle', 'Edler', 'nedlerc@newyorker.com', 2, '1965-01-05', 4, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (14, 'Mélina', 'Bourton', 'lbourtond@miibeian.gov.cn', 'Genderqueer', '1983-06-26', 1, 5);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (15, 'Camélia', 'Stripling', 'jstriplinge@java.com', 'Genderfluid', '2000-03-12', 4, 1);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (16, 'Irène', 'Castanaga', 'icastanagaf@google.com.br', 2, '2023-08-15', 3, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (17, 'Léone', 'Cranstone', 'ecranstoneg@google.it', 2, '1988-12-28', 1, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (18, 'Maëly', 'Trayton', 'jtraytonh@barnesandnoble.com', 2, '2008-06-12', 4, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (19, 'Néhémie', 'Gronav', 'sgronavi@whitehouse.gov', 1, '2007-06-15', 1, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (20, 'Kuí', 'O''Garmen', 'sogarmenj@posterous.com', 2, '1998-03-16', 3, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (21, 'Mårten', 'Haspineall', 'ahaspineallk@cdbaby.com', 'Polygender', '2005-11-09', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (22, 'Gaïa', 'Egarr', 'pegarrl@toplist.cz', 2, '1980-02-11', 3, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (23, 'Angèle', 'Tickle', 'dticklem@washington.edu', 1, '1983-09-10', 1, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (24, 'Maëline', 'MacKowle', 'omackowlen@zimbio.com', 'Genderfluid', '1962-01-06', 1, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (25, 'Märta', 'Porch', 'cporcho@qq.com', 'Genderfluid', '1986-07-29', 1, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (26, 'Léana', 'Bessett', 'sbessettp@economist.com', 1, '2013-06-23', 1, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (27, 'Eugénie', 'Petrello', 'lpetrelloq@reuters.com', 2, '1964-01-24', 3, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (28, 'Loïs', 'Caneo', 'jcaneor@harvard.edu', 1, '1965-01-02', 3, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (29, 'Bécassine', 'Odhams', 'nodhamss@is.gd', 1, '2007-02-27', 4, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (30, 'Bérénice', 'Gateman', 'jgatemant@hhs.gov', 2, '1991-03-01', 4, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (31, 'Cléa', 'Caverhill', 'bcaverhillu@mayoclinic.com', 2, '2002-02-08', 1, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (32, 'Styrbjörn', 'Foucar', 'afoucarv@nps.gov', 1, '1997-12-29', 1, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (33, 'Océane', 'Aleksashin', 'baleksashinw@chron.com', 2, '1996-03-02', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (34, 'Maéna', 'Brownlee', 'ebrownleex@scribd.com', 2, '1964-07-29', 4, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (35, 'Danièle', 'Hunnam', 'nhunnamy@theguardian.com', 1, '2006-12-19', 3, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (36, 'Yáo', 'Mee', 'dmeez@bravesites.com', 2, '1963-05-17', 3, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (37, 'Garçon', 'Liddiatt', 'aliddiatt10@typepad.com', 1, '1985-08-14', 3, 1);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (38, 'Illustrée', 'Farfull', 'efarfull11@1688.com', 1, '2000-01-24', 1, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (39, 'Michèle', 'Capon', 'hcapon12@yale.edu', 1, '2005-01-18', 1, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (40, 'Régine', 'Goulder', 'lgoulder13@twitpic.com', 2, '2008-04-02', 1, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (41, 'Josée', 'Lightbody', 'alightbody14@mac.com', 2, '1987-03-30', 4, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (42, 'Aimée', 'Rudman', 'trudman15@sina.com.cn', 2, '2008-10-31', 3, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (43, 'Renée', 'Gregg', 'bgregg16@yellowbook.com', 2, '2017-08-13', 3, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (44, 'Marie-josée', 'Stanners', 'cstanners17@feedburner.com', 2, '1993-05-11', 1, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (45, 'Illustrée', 'Strafford', 'dstrafford18@parallels.com', 2, '2002-06-03', 3, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (46, 'Léonore', 'Elcox', 'relcox19@vkontakte.ru', 1, '2022-06-02', 3, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (47, 'Maëly', 'Carrivick', 'scarrivick1a@gov.uk', 2, '1994-01-29', 3, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (48, 'Geneviève', 'McFayden', 'nmcfayden1b@aol.com', 1, '1966-05-14', 3, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (49, 'Nadège', 'Renowden', 'crenowden1c@furl.net', 2, '1991-12-08', 4, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (50, 'Yè', 'Brunker', 'mbrunker1d@bluehost.com', 1, '2018-06-26', 3, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (51, 'Thérèsa', 'Kindleysides', 'rkindleysides1e@foxnews.com', 2, '1981-09-10', 1, 8);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (52, 'Lèi', 'Willimont', 'wwillimont1f@army.mil', 2, '2004-03-01', 3, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (53, 'Clélia', 'Darwent', 'zdarwent1g@multiply.com', 2, '2001-10-01', 4, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (54, 'Rachèle', 'Bradmore', 'dbradmore1h@rakuten.co.jp', 1, '2011-12-25', 1, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (55, 'Dà', 'Huburn', 'mhuburn1i@intel.com', 2, '1961-03-13', 1, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (56, 'Clélia', 'Hargreave', 'jhargreave1j@macromedia.com', 1, '1989-12-28', 3, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (57, 'Céline', 'Dring', 'bdring1k@csmonitor.com', 1, '1980-07-29', 3, 12);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (58, 'Görel', 'Seine', 'fseine1l@abc.net.au', 2, '1993-11-02', 4, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (59, 'Loïs', 'Kettle', 'lkettle1m@reuters.com', 1, '1981-07-08', 4, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (60, 'Félicie', 'MacCulloch', 'cmacculloch1n@jigsy.com', 2, '1995-11-28', 4, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (61, 'Ruì', 'Corrie', 'scorrie1o@cmu.edu', 1, '1986-02-09', 3, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (62, 'Bérénice', 'Dumpleton', 'tdumpleton1p@myspace.com', 2, '1963-09-24', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (63, 'Marylène', 'Ledster', 'gledster1q@prnewswire.com', 1, '1990-03-18', 3, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (64, 'Kuí', 'Fitzsimons', 'afitzsimons1r@ebay.co.uk', 1, '1989-11-01', 1, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (65, 'Dà', 'Kalf', 'nkalf1s@businessinsider.com', 1, '1976-12-16', 1, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (66, 'Bécassine', 'Ferreli', 'iferreli1t@youku.com', 2, '1984-04-11', 3, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (67, 'Marie-josée', 'Northedge', 'knorthedge1u@baidu.com', 1, '1965-07-31', 1, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (68, 'Méghane', 'Martinez', 'fmartinez1v@feedburner.com', 2, '1973-05-30', 4, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (69, 'Adèle', 'Spandley', 'ispandley1w@addthis.com', 1, '1970-07-19', 3, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (70, 'Håkan', 'Stapylton', 'dstapylton1x@about.com', 1, '2011-02-03', 4, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (71, 'Gaétane', 'Elleyne', 'selleyne1y@symantec.com', 1, '1992-04-29', 3, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (72, 'Angélique', 'Newborn', 'anewborn1z@economist.com', 1, '1984-11-02', 4, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (73, 'Salomé', 'Aldritt', 'caldritt20@live.com', 1, '1969-07-19', 4, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (74, 'Mélinda', 'Sewards', 'asewards21@google.co.uk', 1, '1967-04-24', 1, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (75, 'Måns', 'covino', 'gcovino22@cisco.com', 2, '1979-09-09', 4, 5);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (76, 'Mårten', 'Blemen', 'cblemen23@bravesites.com', 1, '1988-05-30', 1, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (77, 'Anaël', 'Crabtree', 'mcrabtree24@jugem.jp', 2, '1967-09-25', 4, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (78, 'Yóu', 'Kenna', 'hkenna25@europa.eu', 2, '1989-02-23', 3, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (79, 'Laurène', 'Hanmore', 'jhanmore26@omniture.com', 2, '2009-05-02', 3, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (80, 'Lén', 'Whorlow', 'cwhorlow27@gov.uk', 2, '2014-08-28', 4, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (81, 'Irène', 'Trapp', 'ytrapp28@addthis.com', 2, '2004-11-29', 1, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (82, 'Marie-thérèse', 'Freshwater', 'efreshwater29@constantcontact.com', 2, '1985-04-09', 1, 11);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (83, 'Ophélie', 'Gulk', 'ygulk2a@ucoz.ru', 1, '2023-02-12', 4, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (84, 'Andréanne', 'Kynston', 'akynston2b@ebay.co.uk', 1, '1981-08-30', 1, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (85, 'Ráo', 'McConnal', 'emcconnal2c@ifeng.com', 2, '1970-02-22', 1, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (86, 'Faîtes', 'Parkins', 'rparkins2d@studiopress.com', 2, '1980-06-15', 4, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (87, 'Östen', 'Rooms', 'mrooms2e@nhs.uk', 1, '1979-09-17', 1, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (88, 'Angélique', 'Mosedill', 'kmosedill2f@domainmarket.com', 2, '2011-08-27', 4, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (89, 'Noëlla', 'Baldery', 'vbaldery2g@whitehouse.gov', 'Genderqueer', '1970-06-17', 3, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (90, 'Adélaïde', 'Beagan', 'mbeagan2h@examiner.com', 'Genderfluid', '1987-12-08', 4, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (91, 'Intéressant', 'Kowalik', 'dkowalik2i@163.com', 2, '2011-03-10', 3, 3);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (92, 'Fèi', 'Burleton', 'rburleton2j@wunderground.com', 2, '1989-07-17', 4, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (93, 'Sélène', 'Cauderlie', 'scauderlie2k@google.es', 2, '2012-10-15', 3, 11);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (94, 'Göran', 'Leason', 'dleason2l@feedburner.com', 1, '2019-12-15', 1, 5);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (95, 'Agnès', 'Widger', 'twidger2m@mtv.com', 1, '1997-12-16', 1, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (96, 'Aimée', 'Clawson', 'aclawson2n@hugedomains.com', 1, '2009-05-21', 4, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (97, 'Françoise', 'Andreasson', 'candreasson2o@shutterfly.com', 'Agender', '1990-02-02', 3, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (98, 'Lén', 'Comoletti', 'jcomoletti2p@domainmarket.com', 2, '1976-01-02', 4, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (99, 'Björn', 'Eshelby', 'ceshelby2q@alibaba.com', 1, '2012-01-21', 3, 12);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (100, 'Amélie', 'Milam', 'gmilam2r@yandex.ru', 1, '1984-04-19', 1, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (101, 'Åsa', 'Slainey', 'hslainey2s@quantcast.com', 2, '1990-02-15', 4, 11);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (102, 'Valérie', 'Ortiger', 'mortiger2t@spiegel.de', 1, '2002-02-16', 3, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (103, 'Dorothée', 'Weippert', 'eweippert2u@typepad.com', 2, '2010-09-03', 4, 9);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (104, 'Yè', 'Lambin', 'hlambin2v@ucoz.ru', 1, '1961-10-21', 4, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (105, 'Nadège', 'Richardin', 'wrichardin2w@gizmodo.com', 2, '1961-03-01', 3, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (106, 'Maïly', 'Narramore', 'jnarramore2x@jimdo.com', 2, '2016-04-30', 3, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (107, 'Stévina', 'Pregal', 'spregal2y@oaic.gov.au', 2, '1998-11-03', 4, 1);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (108, 'Zoé', 'Forkan', 'aforkan2z@acquirethisname.com', 2, '1961-10-08', 3, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (109, 'Maïlys', 'Searle', 'bsearle30@purevolume.com', 'Genderqueer', '2013-06-15', 1, 5);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (110, 'Régine', 'Crampin', 'acrampin31@1688.com', 1, '2011-10-21', 4, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (111, 'Lucrèce', 'Phelipeaux', 'fphelipeaux32@histats.com', 2, '2023-10-04', 1, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (112, 'Médiamass', 'Larmour', 'jlarmour33@t.co', 2, '1961-07-01', 3, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (113, 'Maïly', 'Thunders', 'dthunders34@yahoo.com', 'Non-binary', '1991-05-03', 3, 12);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (114, 'Esbjörn', 'Kedwell', 'bkedwell35@cornell.edu', 2, '1991-12-04', 4, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (115, 'Pénélope', 'Copeman', 'rcopeman36@sphinn.com', 1, '1976-05-11', 3, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (116, 'Dà', 'Gregoli', 'mgregoli37@t.co', 2, '2022-10-29', 1, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (117, 'Aurélie', 'McKnockiter', 'gmcknockiter38@miitbeian.gov.cn', 2, '1993-07-22', 1, 21);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (118, 'Anaël', 'Mussared', 'imussared39@photobucket.com', 2, '2001-09-17', 4, 13);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (119, 'Marie-hélène', 'Scarisbrick', 'pscarisbrick3a@ezinearticles.com', 2, '1980-07-24', 3, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (120, 'Stéphanie', 'Twiddy', 'jtwiddy3b@over-blog.com', 'Agender', '2005-03-10', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (121, 'Tán', 'Nutkin', 'enutkin3c@oakley.com', 1, '1988-12-03', 3, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (122, 'Börje', 'Casham', 'ecasham3d@theguardian.com', 1, '2013-01-31', 3, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (123, 'Anaël', 'Larratt', 'dlarratt3e@live.com', 1, '2015-12-11', 4, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (124, 'Lóng', 'Dunridge', 'adunridge3f@homestead.com', 1, '1996-12-25', 1, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (125, 'Adélaïde', 'Izkovicz', 'aizkovicz3g@google.cn', 'Polygender', '2001-04-22', 4, 20);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (126, 'Solène', 'Picken', 'kpicken3h@free.fr', 1, '1971-02-24', 4, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (127, 'Anaïs', 'Ladbrooke', 'nladbrooke3i@nydailynews.com', 1, '1981-01-05', 1, 18);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (128, 'Pénélope', 'Elloy', 'velloy3j@mediafire.com', 1, '1963-08-10', 3, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (129, 'Sélène', 'Robroe', 'frobroe3k@bravesites.com', 1, '1967-04-04', 3, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (130, 'Mélys', 'Oris', 'boris3l@mozilla.com', 1, '2018-10-19', 4, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (131, 'Stévina', 'Shearsby', 'gshearsby3m@biblegateway.com', 1, '2005-01-17', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (132, 'Méthode', 'Durdle', 'ddurdle3n@myspace.com', 2, '1968-02-15', 3, 2);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (133, 'Célestine', 'Vedenyapin', 'bvedenyapin3o@foxnews.com', 1, '2007-06-18', 4, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (134, 'Joséphine', 'Martelet', 'wmartelet3p@elegantthemes.com', 1, '2006-03-10', 3, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (135, 'Vénus', 'Limerick', 'rlimerick3q@mapy.cz', 2, '1986-02-13', 3, 17);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (136, 'Marie-ève', 'Mattersley', 'lmattersley3r@nps.gov', 1, '1975-04-26', 3, 19);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (137, 'Estève', 'Mackriell', 'smackriell3s@constantcontact.com', 2, '1965-12-02', 1, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (138, 'Åsa', 'Ellph', 'kellph3t@theguardian.com', 'Agender', '1977-05-26', 4, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (139, 'Célia', 'Olford', 'molford3u@4shared.com', 2, '1961-05-13', 3, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (140, 'Maëlann', 'Hugues', 'whugues3v@microsoft.com', 2, '1971-10-02', 4, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (141, 'Clémence', 'Coolahan', 'bcoolahan3w@google.com', 1, '2018-12-25', 1, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (142, 'Laïla', 'Varfalameev', 'lvarfalameev3x@usa.gov', 2, '1961-06-20', 1, 10);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (143, 'Agnès', 'Torrijos', 'dtorrijos3y@cmu.edu', 1, '1988-06-02', 4, 15);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (144, 'Lyséa', 'McKirdy', 'fmckirdy3z@mac.com', 2, '2008-08-03', 3, 6);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (145, 'Maëlle', 'MacConchie', 'dmacconchie40@nbcnews.com', 1, '2000-07-08', 3, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (146, 'Méghane', 'Kear', 'ckear41@shutterfly.com', 2, '2008-11-03', 1, 14);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (147, 'Pò', 'Robjohns', 'crobjohns42@ebay.co.uk', 2, '1972-12-26', 3, 7);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (148, 'Kù', 'Sharville', 'fsharville43@digg.com', 2, '2001-04-12', 3, 16);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (149, 'Régine', 'Berkery', 'mberkery44@mashable.com', 1, '2018-11-29', 1, 4);
insert into utilisateurs (id, first_name, last_name, email, gender, date_of_birth, status, grade) values (150, 'Daphnée', 'Hastilow', 'ghastilow45@zimbio.com', 1, '1980-03-10', 1, 13);
