const express = require('express');
const app = express();

// 2. seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 3. invocar a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

// 4. setar el public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));
console.log(__dirname);

// 5. establecer motor de plantillas, en este caso, ejs
app.set('view engine', 'ejs');

// 6. Criptar contraseñas
const bcryptjs = require('bcryptjs');

// 7. variables de sesion
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// 8. módulo de conexión de la bd
const connection = require('./database/db');

// 9. establecer rutas para vistas


app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// método de register backend
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;

    // encriptación de contraseña en 8 iteraciones
    let passwordHaash = await bcryptjs.hash(pass, 8);

    // consulta
    connection.query('INSERT INTO users SET ?', { user: user, name: name, rol: rol, pass: passwordHaash }, async (error, results) => {
        if (error) {
            console.log(" Error al registrar usuario:", error);
        } else {
            //  Con este comando puedo ver los datos que se inserten
            console.log('Registro insertado con ID:', results.insertId);
            console.log("Nuevo usuario registrado en la base de datos medify:");
            console.log("Usuario:", user);
            console.log("Nombre:", name);
            console.log("Rol:", rol);
            console.log("Contraseña encriptada:", passwordHaash);
            console.log("-------------------------");

            // renderizar  alerta 
            res.render('register', {
                alert: true,
                alertTitle: "Registro completado",
                alertMessage: "Registración exitosa en Medify!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: '' // redirige a "/"
            });
        }
    });
});



///autentificación
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    if(user && pass){
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))){
                res.render('login', {
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Usuario o contraseña incorrectas.",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });

            }else{
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login',{
                alert: true, 
                alertTitle: "Conexión exitosa!",
                alertMessage: "Login correcto!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
                });
            }
        })
    }else{
        res.render('login',{
                alert: true, 
                alertTitle: "Advertencia",
                alertMessage: "Por favor, ingrese su usuario y password!",
                alertIcon: 'warning',
                showConfirmButton: true,
                timer: 3000,
                ruta: 'login'
                });
    }
})


/// auth pages
app.get('/', (req, res) =>{
    if(req.session.loggedin){
        res.render('index',{
            login: true,
            name: req.session.name
        });
    }else{
        res.render('index',{
            login: false,
            name:'Debe iniciar sesión'
        })
    }
})

//13- set de logout
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})


app.listen(3000, () => {
    console.log('Servidor conectado en el puerto 3000');
});




