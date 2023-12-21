import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import session from 'express-session';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'src')));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'password',
    resave: false,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: 'williamsuryawijaya.my.id',
    user: 'williams_tubes_rpl',
    password: 'sekelimus',
    database: 'williams_tubes_rpl',
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('landingPage');
});

app.get('/login', (req, res) => {
    res.render('Login');
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request:', email, password);

    connection.query('SELECT idStaff, namaStaff FROM StaffGym WHERE idStaff = ? AND passwordStaff = ?', [email, password], (error, staffResults) => {
        console.log('Staff query results:', staffResults);
        if (error) {
            console.log('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        } else if (staffResults.length > 0) {
            const { idStaff, namaStaff } = staffResults[0];
            req.session.idUser = idStaff;
            req.session.userName = namaStaff;
            req.session.save(() => {
                res.redirect('/mainpagestaff');
            });
        } else {
            connection.query('SELECT idMember, namaMember FROM Member WHERE emailMember = ? AND passwordMember = ?', [email, password], (error, memberResults) => {
                console.log('Member query results:', memberResults);
                if (error) {
                    console.log('Error:', error);
                    res.status(500).json({ error: 'An error occurred' });
                } else if (memberResults.length > 0) {
                    const { idMember, namaMember } = memberResults[0];
                    req.session.idUser2 = idMember;
                    req.session.userName2 = namaMember;
                    req.session.save(() => {
                        res.redirect('/mainpage');
                    });
                } else {
                    console.log('Data tidak terdaftar');
                    res.render('Login', { error: 'Please check your email and password' });
                }
            });
        }
    });
});


app.get('/signup', (req, res) => {
    res.render('SignUp');
});

app.post('/signup', (req, res) => {
    const { nama, email, password } = req.body;
    const checkQuery = 'SELECT COUNT(*) AS count FROM Member WHERE emailMember = ?';
    const insertQuery = 'INSERT INTO Member (namaMember, emailMember, passwordMember, saldoMember, isMembership) VALUES (?, ?, ?, 0, 0)';
    const values = [nama, email, password];

    connection.query(checkQuery, [email], (checkErr, checkResult) => {
        if (checkErr) {
            console.error(checkErr);
            res.status(500).send('Error');
        } else {
            const emailExists = checkResult[0].count > 0;
            if (emailExists) {
                return res.status(409).json({ error: 'Email already exists' });
            } else {
                connection.query(insertQuery, values, (insertErr) => {
                    if (insertErr) {
                        console.error(insertErr);
                        res.status(500).send('Error');
                    } else {
                        return res.status(200).json({ success: 'Account Created' });
                    }
                });
            }
        }
    });
});

app.get('/mainpage', (req, res) => {
    const userId = req.session.idUser2;
    if (userId === undefined) {
        return res.redirect('/');
    }

    const query = 'SELECT namaMember, isMembership FROM Member WHERE idMember = ?'
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.log('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const namaMember = results.length > 0? results[0].namaMember : null;
            const isMembership = results.length > 0? results[0].isMembership : null;
            res.render('MainPage', { namaMember, isMembership });
        }
    });
});

app.get('/membership', (req, res) => {
    const userId = req.session.idUser2;
    if (userId === undefined) {
        return res.redirect('/');
    }

    const query = 'SELECT namaMember, isMembership, saldoMember FROM Member WHERE idMember = ?'
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.log('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const namaMember = results.length > 0? results[0].namaMember : null;
            const isMembership = results.length > 0? results[0].isMembership : null;
            const saldoMember = results.length > 0? results[0].saldoMember : 0;
            res.render('Membership', { namaMember, isMembership, saldoMember });
        }
    });
});

app.get('/memberships', (req, res) => {
    const userId = req.session.idUser2;
    console.log(userId);
    const checkMembershipQuery = 'SELECT isMembership, saldoMember FROM Member WHERE idMember = ?';
    connection.query(checkMembershipQuery, [userId], (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking membership status:', checkError);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const isMember = checkResults[0].isMembership === 1;
            if (isMember) {
                res.status(200).json({ alreadyMember: true });
            } else {
                const updateMembershipQuery = 'UPDATE Member SET isMembership = 1, saldoMember = saldoMember - 10 WHERE idMember = ?';
                connection.query(updateMembershipQuery, [userId], (updateError) => {
                    if (updateError) {
                        console.error('Error joining Membership:', updateError);
                        res.status(500).json({ error: 'An error occurred' });
                    } else {
                        res.redirect('/membership');
                    }
                });
            }
        }
    });
});

app.get('/aboutus', (req, res) => {
    const userId = req.session.idUser2;
    if (userId === undefined) {
        return res.redirect('/');
    }

    const query = 'SELECT namaMember, isMembership FROM Member WHERE idMember = ?'
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.log('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const namaMember = results.length > 0? results[0].namaMember : null;
            const isMembership = results.length > 0? results[0].isMembership : null;
            res.render('aboutUs', { namaMember, isMembership });
        }
    });
});

app.get('/bookschedule', (req, res) => {
    const userId = req.session.idUser2;
    if (userId === undefined) {
        return res.redirect('/');
    }
    console.log(userId);
    const query = 'SELECT saldoMember, namaMember, isMembership FROM Member WHERE idMember = ?';
    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.log('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const saldoMember = results.length > 0? results[0].saldoMember : null;
            const namaMember = results.length > 0? results[0].namaMember : null;
            const isMembership = results.length > 0? results[0].isMembership : null;
            res.render('BookSchedule', { saldoMember, namaMember, isMembership });
        }
    })
});

app.post('/check-availability', (req, res) => {
    const { date, time } = req.body;
    
    if (!date || !time) {
        return res.status(400).json({ error: 'Date and time are required' });
    }

    console.log(date, time);

    connection.query('SELECT COUNT(*) as numBookings FROM ScheduleGym WHERE startDate = ? AND startTime = ?', [date, time], (error, results) => {
        if (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({ error: 'An error occurred while checking availability' });
        } else {
            const numBookings = results[0].numBookings;
            const capacity = 10;
            const availableCapacity = capacity - numBookings;

            if (availableCapacity <= 0) {
                res.json({ date, time, capacity: 0 }); 
            } else {
                res.json({ date, time, capacity: availableCapacity });
            }
        }
    });
});



app.post('/bookschedule', (req, res) => {
    const { date, time } = req.body;
    const userId = req.session.idUser2;
    console.log(date, time);

    const membershipQuery = 'SELECT isMembership FROM Member WHERE idMember = ?';
    connection.query(membershipQuery, [userId], (membershipError, membershipResults) => {
        if (membershipError) {
            console.error('Error checking membership:', membershipError);
            return res.status(500).json({ error: 'An error occurred while checking membership' });
        }

        const isMembership = membershipResults[0].isMembership;

        const pointsToDeduct = isMembership ? 0 : 1;

        const checkBalanceQuery = 'SELECT saldoMember FROM Member WHERE idMember = ?';
        connection.query(checkBalanceQuery, [userId], (balanceError, balanceResults) => {
            if (balanceError) {
                console.error('Error checking balance:', balanceError);
                return res.status(500).json({ error: 'An error occurred while checking balance' });
            }

            const userBalance = balanceResults[0].saldoMember;

            if (userBalance < pointsToDeduct) {
                return res.status(400).json({ error: 'Insufficient balance. Please top up your account.' });
            }

            function generateUniqueToken(userId) {
                const currentDate = new Date();
                const day = currentDate.getDate().toString().padStart(2, '0');
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                const year = currentDate.getFullYear().toString().substr(-2);
            
                const randomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
            
                const token = `${day}${month}${year}${userId}${randomChars}`;
                
                return token;
            }
            
            const generatedToken = generateUniqueToken(userId);
            console.log(generatedToken);

            const scheduleQuery = 'INSERT INTO ScheduleGym (startDate, startTime, endTime) VALUES (?, ?, ?)';
            const startTime = new Date(`2000-01-01T${time}`);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
            connection.query(scheduleQuery, [date, startTime, endTime], function (error, scheduleResults) {
                console.log(scheduleResults);
                if (error) {
                    console.error('Error inserting into ScheduleGym:', error);
                    return res.status(500).json({ error: 'An error occurred' });
                }

                const authTokenQuery = 'INSERT INTO AuthToken (tokenEligible, tokenNumber, idMember) VALUES (?, ?, ?)';
                connection.query(authTokenQuery, [1, generatedToken, userId], function (error, authTokenResults) {
                    if (error) {
                        console.error('Error inserting into AuthToken:', error);
                        return res.status(500).json({ error: 'An error occurred' });
                    }
                    const bookingQuery = 'INSERT INTO Booking (statusPembayaran, idMember, idToken, idSchedule) VALUES (?, ?, ?, ?)';
                    connection.query(bookingQuery, [1, userId, authTokenResults.insertId, scheduleResults.insertId], function (error) {
                        if (error) {
                            console.error('Error inserting into Booking:', error);
                            return res.status(500).json({ error: 'An error occurred' });
                        }

                        if (!isMembership) {
                            const saldoKurang = 'UPDATE Member SET saldoMember = saldoMember - 1 WHERE idMember = ?';
                            connection.query(saldoKurang, [userId], function (error) {
                                if (error) {
                                    console.error('Error updating saldoMember:', error);
                                    return res.status(500).json({ error: 'An error occurred' });
                                }
                                console.log('Data inserted successfully. Response status:', res.statusCode);
                                res.json({ success: true, message: 'Data inserted successfully', generatedToken });
                            });
                        } else {
                            console.log('Data inserted successfully. Response status:', res.statusCode);
                            res.json({ success: true, message: 'Data inserted successfully', generatedToken });
                        }
                    });
                });
            });
        });
    });
});



app.get('/viewtokens', (req, res) => {
    const userId = req.session.idUser2;
    if (userId === undefined) {
        return res.redirect('/');
    }
    const memberQuery = 'SELECT namaMember, saldoMember, isMembership FROM Member WHERE idMember = ?';

    const tokensQuery = 'SELECT ScheduleGym.startDate, ScheduleGym.startTime, ScheduleGym.endTime, AuthToken.tokenNumber, AuthToken.tokenEligible FROM Booking JOIN ScheduleGym ON Booking.idSchedule = ScheduleGym.idSchedule JOIN AuthToken ON AuthToken.idToken = Booking.idToken WHERE Booking.idMember = ?';

    Promise.all([
        executeQuery(memberQuery, [userId]),
        executeQuery(tokensQuery, [userId])
    ])
    .then(([memberResults, tokensResults]) => {
        const namaMember = memberResults.length > 0 ? memberResults[0].namaMember : null;
        const saldoMember = memberResults.length > 0 ? memberResults[0].saldoMember : null;
        const isMembership = memberResults.length > 0 ? memberResults[0].isMembership : null;

        const tokens = tokensResults.map(result => ({
            startDate: result.startDate,
            startTime: result.startTime,
            endTime: result.endTime,
            tokenNumber: result.tokenNumber,
            tokenEligible: result.tokenEligible
        }));

        res.render('ViewTokens', { namaMember, saldoMember, isMembership, tokens });
    })
    .catch(error => {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    });
});

function executeQuery(query, params) {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/mainpagestaff', (req, res) => {
    const userId = req.session.idUser;
    if (userId === undefined) {
        return res.redirect('/');
    }
    
    res.render('MainPageStaff');
});

app.get('/topup', (req, res) => {
    const userId = req.session.idUser;
    if (userId === undefined) {
        return res.redirect('/');
    }

    res.render('TopUp');
});

app.post('/topup', (req, res) => {
    const { emailMember, jumlahPoint } = req.body;
    console.log(emailMember, jumlahPoint);

    const query = 'UPDATE Member SET saldoMember = saldoMember + ? WHERE emailMember = ?';

    connection.query(query, [jumlahPoint, emailMember], (error, results) => {
        if (error) {
            console.error('Error updating points:', error);
            return res.status(500).json({ success: false, message: 'An error occurred' });
        }

        if (results.affectedRows > 0) {
            return res.json({ success: true, message: 'Points updated successfully' });
        } else {
            return res.json({ success: false, message: 'Member not found or points not updated' });
        }
    });
});

app.get('/verifstaff', (req, res) => {
    const userId = req.session.idUser;
    if (userId === undefined) {
        return res.redirect('/');
    }
    res.render('VerifStaff');
});

app.post('/check-token', (req, res) => {
    const { token } = req.body;

    const querySelect = 'SELECT Member.idMember FROM Member JOIN AuthToken ON Member.`idMember` = AuthToken.`idMember` WHERE AuthToken.`tokenNumber` = ? AND AuthToken.`tokenEligible` = 1';

    connection.query(querySelect, [token], (error, results) => {
        if (error) {
            console.error('Error checking token:', error);
            return res.status(500).json({ success: false, message: 'An error occurred' });
        }

        if (results.length > 0) {
            const memberId = results[0].idMember;

            const queryUpdate = 'UPDATE AuthToken SET tokenEligible = 0 WHERE tokenNumber = ?';
            connection.query(queryUpdate, [token], (updateError) => {
                if (updateError) {
                    console.error('Error updating token:', updateError);
                    return res.status(500).json({ success: false, message: 'An error occurred' });
                }

                return res.json({ success: true, isValid: true, memberId, message: 'Token is valid' });
            });
        } else {
            return res.json({ success: false, isValid: false, message: 'Invalid token' });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
    if (error) {
        console.log('Error destroying session:', error);
        res.status(500).json({ error: 'An error occurred' });
    } else {
        res.redirect('/');
    }
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
