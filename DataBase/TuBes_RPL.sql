CREATE TABLE Member (
  idMember INT NOT NULL AUTO_INCREMENT,
  namaMember VARCHAR(100),
  emailMember VARCHAR(50),
  passwordMember VARCHAR(50),
  saldoMember INT,
  isMembership INT,
  PRIMARY KEY (idMember)
);

CREATE TABLE StaffGym (
  idStaff INT NOT NULL,
  namaStaff VARCHAR(100),
  passwordStaff VARCHAR(100),
  PRIMARY KEY (idStaff)
);

CREATE TABLE ScheduleGym (
  idSchedule INT NOT NULL AUTO_INCREMENT,
  startDate DATE,
  startTime TIME,
  endTime TIME,
  PRIMARY KEY (idSchedule)
);

CREATE TABLE Booking (
  idBooking INT NOT NULL AUTO_INCREMENT,
  statusPembayaran INT,
  idMember INT,
  idSchedule INT,
  idToken INT,
  PRIMARY KEY (idBooking)
);

CREATE TABLE AuthToken (
  idToken INT NOT NULL AUTO_INCREMENT,
  tokenEligible INT,
  tokenNumber VARCHAR(10),
  idMember INT,
  PRIMARY KEY (idToken)
);

CREATE TABLE TopUp (
  idMember INT NOT NULL,
  idStaff INT NOT NULL,
  FOREIGN KEY (idMember) REFERENCES Member(idMember),
  FOREIGN KEY (idStaff) REFERENCES StaffGym(idStaff)
);

CREATE TABLE Verify (
  idStaff INT NOT NULL,
  idToken INT NOT NULL,
  FOREIGN KEY (idStaff) REFERENCES StaffGym(idStaff),
  FOREIGN KEY (idToken) REFERENCES AuthToken(idToken)
);

-- step 1
ALTER TABLE authtoken
ADD FOREIGN KEY (idMember)
REFERENCES Member(idMember);

-- step 2`schedulegym`
ALTER TABLE booking
ADD FOREIGN KEY (idMember)
REFERENCES Member(idMember);

ALTER TABLE booking
ADD FOREIGN KEY (idSchedule)
REFERENCES schedulegym(idschedule);

ALTER TABLE booking
ADD FOREIGN KEY (idToken)
REFERENCES authtoken(idToken);
    
INSERT INTO StaffGym (idStaff, namaStaff, passwordStaff)
VALUES
    (1, 'Staff1', 'password123'),
    (2, 'Staff2', 'password456'),
    (3, 'Staff3', 'password789'),
    (4, 'Staff4', 'passwordabc');