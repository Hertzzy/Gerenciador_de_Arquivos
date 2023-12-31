//import express para gerencimento de rotas requisições e urls
const express = require('express');
//Import Sequelize conexão com banco de dados
const {
    where
} = require('sequelize');
//Rotas app. = express
const app = express();
//Senha criptografada
const bcrypt = require('bcryptjs');
//TOKEN JWT que gera quando o usuário acesso o sistema
const jwt = require('jsonwebtoken');
//Upload de arquivos tipo PDF
const uploadDocs = require('./middleware/uploadfile');

const path = require('path');
//Autenticação do usuário
const {
    eAdmin
} = require('./middleware/auth');

//Import implementação das tabelas no banco de dados
//Tabela de Usuarios e Documentos
const Users = require("./models/Users");
const Docs = require("./models/Docs.js");
const {
    error,
    count
} = require('console');

//Permissão CORS liberada
var cors = require('cors');

//Caminho onde os PDFs são armazenados
app.use('/files', express.static(path.resolve(__dirname, "public", "upload")));

//Configuração CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
    res.header('Access-Control-Allow-Headers', "X-PINGOTHER ,Content-Type, Authorization");
    app.use(cors())
    next();
});
//Express JSON
app.use(express.json());

//Rota principal
app.get('/', eAdmin, async (req, res) => {
    await Users.findAll({
            attributes: ['id', 'name', 'email', 'permissions'],
            order: [
                ['id', "DESC"]
            ]
        })
        .then((users) => {
            return res.json({
                users,
                id_usuario_logado: req.userId
            });
        }).catch(() => {
            return res.status(400).json({
                mensagem: "Erro: Nenhum usuário encontrado!"
            });
        });
});

//Rota de Cadastro de usuário
app.post('/register', async (req, res) => {
    var dados = req.body;
    //Criptografando SENHA do usuário e cadastrando no sitema
    //Senha no mínimo 6 caracteres
    dados.password = await bcrypt.hash(dados.password, 6);

    await Users.create(dados)
        .then(() => {
            return res.json({
                mensagem: "Usuário cadastrado!",
            });
        }).catch(() => {
            if (dados.email.includes) {
                return res.status(400).json({
                    mensagem: "Esse email já foi cadastrado!"
                });
            }
            return res.status(400).json({
                mensagem: "Erro: Usuário não cadastrado!"
            });

        });
});

//Rota de listagem de usuários
app.get("/listUsers", async (req, res) => {
    //Paginação para implementação na tablela no frontEnd
    const {
        page = 1
    } = req.query;

    const limit = 50;
    var lastPage = 1;

    const countUser = await Users.count();

    if (countUser !== 0) {
        lastPage = Math.ceil(countUser / limit);
    } else {
        return res.status(400).json({
            mensagem: "Erro: Nenhum usuário encontrado!"
        });
    }
    //Seleciona todos os usuarios pegando os dados cadastrados: ID, NAME, EMAIL, PERMISSIONS
    const users = await Users.findAll({
        attributes: ['id', 'name', 'email', 'permissions'],
        order: [
            ['id',
                'ASC'
            ]
        ],
        //paginação
        offset: Number((page * limit) - limit),
        limit: limit
    })
    //Se existir usuários nos sitema é feita a paginação
    if (users) {
        var pagination = {
            //CAMINHO
            path: '/listUsers',
            //pagina atual
            page,
            //pagina anterior
            prev_page_url: (page) - 1 >= 1 ? page - 1 : false,
            // proxima pagina
            next_page_url: Number(page) + Number(1) > lastPage ? false : Number(page) + 1,
            //Ultima pagina
            lastPage,
            //Quantidade total de registros
            total: countUser
        }
        //Retorno dos dados do usuario e paginação
        return res.json({
            users,
            pagination
        })
        //Se não existir cadastros retorna ERRO 400
    } else {
        return res.status(400).json({
            mensagem: "Erro: Nenhum usuário encontrado!"
        });
    }
});

//Rota visualizar usuário selecionado pelo ID
app.get("/visualizar-usuario/:id", async (req, res) => {
    //receber ID
    const {
        id
    } = req.params

    // var dados = req.body;
    // dados.password = 
    //Encontra o usuário selecionado pelo paramentro ID
    const user = await Users.findOne({
        attributes: ['id', 'name', 'email', 'permissions', 'password'],
        where: {
            id
        }
    })
    //Se existir usuário ID retorna seus valores
    if (user) {
        return res.json({
            user: user.dataValues
        })
        //Se não exister retorna ERRO 400
    } else {
        return res.status(400).json({
            mensagem: "Erro: Nenhum usuário encontrado!"
        });
    }
});

//Rota de edição de dados de usuario pelo ID selecionado
app.put("/edit-user/:id", async (req, res) => {
    //receber ID
    const {
        id
    } = req.params;

    //Pega os dados do usuario
    var dados = req.body;
    // //Criptografa a Nova Senha
    dados.password = await bcrypt.hash(dados.password, 6);

    await Users.update(dados, {
            where: {
                id
            }
        })
        .then(() => {
            return res.json({
                mensagem: "Usuário editado com sucesso!"
            })
        }).catch(() => {
            return res.status(400).json({
                mensagem: "Erro ao editar usuário"
            })
        })
});

//Route delete usuario pelo ID
app.delete("/deleteUsers/:id", async (req, res) => {
    //receber ID
    const {
        id
    } = req.params;
    //Delete de usuario
    await Users.destroy({
            where: {
                id
            }
        })
        .then(() => {
            return res.json({
                message: "Usuário deletato!"
            })
        }).catch(() => {
            return res.status(400).json({
                message: "Erro: Falha ao deletar usuario"
            })
        })
});

//Rota de login
app.post('/login', async (req, res) => {
    //Seleciona m unico usuario
    const user = await Users.findOne({
        attributes: ['id', 'name', 'email', 'permissions', 'password'],
        where: {
            email: req.body.email
        }
    });
    //Se não for corretos Senha ou Usuário retorna ERRO 400 
    if (user === null) {
        return res.status(400).json({
            mensagem: "Erro: Usuário ou a senha incorreta!"
        });
    }
    //Comparda senha digitada pelo usuário com a senha do bancod de daods
    //Se foreem diferente retorna ERRO 400
    if (!(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).json({
            mensagem: "Erro: Usuário ou a senha incorreta!"
        });
    }
    //TOKEN para login autenticado
    //TOKEN expira em 1 DIA
    var token = jwt.sign({
        id: user.id
    }, "D62ST92Y7A6V7K5C6W9ZU6W8KS3", {
        expiresIn: '1d'
    });
    //Quando dados do usarios estiverem corretos
    //Login realizado com sucesso
    //Retorna dados do usuario no sistema
    return res.json({
        erro: false,
        message: "Login realizado com sucesso",
        user: {
            id: user.id,
            name: user.name,
            userName: user.email,
            permissions: user.permissions
        },
        token: token
    });
});

//Rota Upload dos documentos
app.post("/upload-docs", uploadDocs.single('image'), (req, res) => {
    //Se existir documentos
    //Cria os dados do documento no Banco de Dados
    //É enviado o nome do documento no Banco de Dados
    var dados = req.body;

    if (req.file) {
        Docs.create({
                name: req.body.name,
                documentType: req.body.documentType,
                documentCode: req.body.documentCode,
                documentCpf: req.body.documentCpf,
                documentRg: req.body.documentRg,
                documentDate: req.body.documentDate,
                image: req.file.filename,
            })
            .then(() => {
                return res.json({
                    mensagem: "Upload realizado!"
                })
            }).catch(() => {
                if (dados.documentCode.includes) {
                    return res.status(400).json({
                        mensagem: "O código do documento já existe!"
                    });
                }
                return res.status(400).json({
                    mensagem: "Erro: Upload não realizado!"
                })
            })
    }
});

//Listagem dos documetnos
app.get("/list-files", async (req, res) => {
    //Paginação para implementação na tabela no FRONTEND REACT
    const {
        page = 1
    } = req.query;

    const limit = 50;
    var lastPage = 1;

    const countUser = await Docs.count();

    if (countUser !== 0) {
        lastPage = Math.ceil(countUser / limit);
    } else {
        return res.status(400).json({
            mensagem: "Adicione o primeiro documento!"
        });
    }
    //Encontrando todos os dados no Banco de dados
    const files = await Docs.findAll({
        attributes: ['id', 'name', 'documentType', 'documentCode', 'documentRg',
            'documentCpf', 'documentDate', 'image', 'createdAt'
        ],
        order: [
            ['id',
                'ASC'
            ]
        ],
        //paginação
        offset: Number((page * limit) - limit),
        limit: limit
    })
    //Se existir documentos 
    if (files) {
        var pagination = {
            //CAMINHO
            path: '/listUsers',
            //pagina atual
            page,
            //pagina anterior
            prev_page_url: (page) - 1 >= 1 ? page - 1 : false,
            // proxima pagina
            next_page_url: Number(page) + Number(1) > lastPage ? false : Number(page) + 1,
            //Ultima pagina
            lastPage,
            //Quantidade total de registros
            total: countUser
        }
        return res.json({
            files,
            url: "http://localhost:8080/files/docUsers/",
            pagination
        })
    } else {
        return res.status(400).json({
            mensagem: "Erro: Nenhum arquivo encontrado!"
        });
    }

});

//Route View Docs ID
app.get("/visualizar-documento/:id", async (req, res) => {
    const {
        id
    } = req.params

    const docs = await Docs.findOne({
        attributes: ['id', 'name', 'documentType', 'documentCode', 'documentRg', 'documentCpf', 'documentDate', 'documentDate',
            'image', 'createdAt'
        ],
        where: {
            id
        }
    })

    if (docs) {
        return res.json({
            file: docs.dataValues,
            url: "http://localhost:8080/files/docUsers/",
        });
    } else {
        return res.status(400).json({
            mensagem: "Erro: Nenhum usuário encontrado!"
        });
    }
});

//Route View only Prontuarios
app.get("/list-prontuario", async (req, res) => {
    //Paginação para implementação na tablela no frontEnd
    const {
        page = 1
    } = req.query;

    const limit = 25;
    var lastPage = 1;

    const countUser = await Docs.count();

    if (countUser !== 0) {
        lastPage = Math.ceil(countUser / limit);
    } else {
        return res.status(400).json({
            mensagem: "Adicione o primeiro prontuario!"
        });
    }
    //Seleciona todos os documentos cadastrados
    const prontuarios = await Docs.findAll({
        attributes: ['id', 'name', 'documentType', 'documentCode', 'documentCpf', 'documentDate', 'image', 'createdAt'],
        order: [
            ['id',
                'ASC'
            ]
        ],
        //paginação
        offset: Number((page * limit) - limit),
        limit: limit
    })
    //Se existir documentos no sistema é feita a paginação
    if (prontuarios) {
        var pagination = {
            //CAMINHO
            path: '/list-prontuario',
            //pagina atual
            page,
            //pagina anterior
            prev_page_url: (page) - 1 >= 1 ? page - 1 : false,
            // proxima pagina
            next_page_url: Number(page) + Number(1) > lastPage ? false : Number(page) + 1,
            //Ultima pagina
            lastPage,
            //Quantidade total de registros
            total: countUser
        }
    }
    //Filtro selecionando somente os prontuarios armazenados no sistema
    let filteredProntuarios = prontuarios.filter((prontuario) => {
        return prontuario.documentType === "prontuario"
    });

    //Link para visualizar o documento
    if (filteredProntuarios) {
        return res.json({
            prontuarios: filteredProntuarios,
            url: "http://localhost:8080/files/docUsers/",
            pagination
        })
    }
    //Retorno dos dados do usuario e paginação
    return res.status(400).json({
        message: "Nenhum prontuário encontrado"
    })
});

//Route View only Process
app.get("/list-process", async (req, res) => {
    //Paginação para implementação na tablela no frontEnd
    const {
        page = 1
    } = req.query;

    const limit = 25;
    var lastPage = 1;

    const countUser = await Docs.count();

    if (countUser !== 0) {
        lastPage = Math.ceil(countUser / limit);
    } else {
        return res.status(400).json({
            mensagem: "Adicione o primeiro documento"
        });
    }
    //Seleciona todos os documentos cadastrados
    const process = await Docs.findAll({
        attributes: ['id', 'name', 'documentType', 'documentCode', 'documentCpf', 'documentDate', 'image', 'createdAt'],
        order: [
            ['id',
                'ASC'
            ]
        ],
        //paginação
        offset: Number((page * limit) - limit),
        limit: limit
    })
    //Se existir documentos no sistema é feita a paginação
    if (process) {
        var pagination = {
            //CAMINHO
            path: '/list-process',
            //pagina atual
            page,
            //pagina anterior
            prev_page_url: (page) - 1 >= 1 ? page - 1 : false,
            // proxima pagina
            next_page_url: Number(page) + Number(1) > lastPage ? false : Number(page) + 1,
            //Ultima pagina
            lastPage,
            //Quantidade total de registros
            total: countUser
        }
    }
    //Filtro selecionando somente os documetA armazenados no sistema
    let filteredProcess = process.filter((process) => {
        return process.documentType === "processo"
    });
    //Link para visualizar o documento
    if (filteredProcess) {
        return res.json({
            process: filteredProcess,
            url: "http://localhost:8080/files/docUsers/",
            pagination
        })
    }
    //Retorno dos dados do usuario e paginação
    return res.status(400).json({
        message: "Nenhum documento não encontrado"
    })
});

//Route Delete Docs
app.delete("/deleteFiles/:id", async (req, res) => {
    //Selecina ID
    const {
        id
    } = req.params;
    //Delete Documentos
    await Docs.destroy({
        where: {
            id
        }
    }).then(() => {
        return res.json({
            message: "Arquivo deletado com sucesso"
        })
    }).catch(() => {
        return res.status(400).json({
            message: "Erro: Falha ao deletar arquivo"
        })
    })
});

//Service port 8080
app.listen(8080, eAdmin, () => {
    console.log("Servido iniciado na porta 8080: http://localhost:8080")
});