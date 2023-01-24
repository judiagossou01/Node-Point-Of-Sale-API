const bcrypt = require('bcrypt');

const {
  selectAllUsers,
  countUsers,
  selectAllRoles,
  countRoles,
  selectDataUser,
  insertDataUser,
  updateDataUser,
  deleteDataUser,
  selectIdUser
} = require('../models/users');

const {
  jsonResponse,
  jsonResponseWithPagination,
  jsonError,
  errorBadRequest
} = require('../helper');

const getAllUsers = async (req, res) => {
  const urlQueries = req.query;
  const result = await selectAllUsers(urlQueries).then(users => {
    return users.map(user => {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        image: `${process.env.PUBLIC_IMAGES}/${user.image}`,
        role_id: user.role_id,
        role_name: user.role_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  }).catch(console.log);
  delete urlQueries.page
  const count = await countUsers(urlQueries)
  .catch(console.log);
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const total_page = Math.ceil(count.total_items / limit);
  const pagination = {
    ...count,
    page,
    limit,
    total_page
  };
  return jsonResponseWithPagination(res, result, pagination);
};

const getAllRoles = async (req, res) => {
  const urlQueries = req.query;
  const result = await selectAllRoles(urlQueries).catch(console.log);
  delete urlQueries.page
  const count = await countRoles(urlQueries)
  .catch(console.log);
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const total_page = Math.ceil(count.total_items / limit);
  const pagination = {
    ...count,
    page,
    limit,
    total_page
  };
  return jsonResponseWithPagination(res, result, pagination);
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const result = await selectDataUser(id).then(user => {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      image: `${process.env.PUBLIC_IMAGES}/${user.image}`,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  }).catch(console.log);

  return jsonResponse(res, result);
};

const postUser = async (req, res) => {
  try {
    const { username, password, email, name, image, role_id } = req.body;
    const data = {
      username,
      email,
      name,
      image: (req.file ? req.file.path : ''),
      role_id,
      password: await bcrypt.hash(password, 10)
    };
    const query = await insertDataUser(data).catch(console.log);
    const id = query.insertId;
    const result = {
      id,
      ...data
    };
    delete result.password;
    return jsonResponse(res, result);
  } catch(error) {
    return jsonError(res, error);
  }
};

const putUser = async (req, res) => {
  try {
    let data = req.body;
    const { id } = req.params;
    if(req.file) {
      data.image = req.file.path;
    }
    if(data.image) {
      data.image = data.image;
    }
    await selectDataUser(id).then(async user => {
      if(user.id) {
        if(data.password && data.password !== '') {
          data.password = await bcrypt.hash(data.password, 10)
        } else {
          delete data.password;
        }
        await updateDataUser(data, id).catch(console.log);
        const result = {
          id,
          ...data
        };
        return jsonResponse(res, result);
      } else {
        return jsonError(res, errorBadRequest);
      }
    }).catch(error =>  {
      if(error) {
        const error = {
          code: 400,
          message: `Data User does not exist!`
        };
        return jsonError(res, error);
      }
    });
  } catch(error) {
    return jsonError(res, errorBadRequest);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await selectDataUser(id).then(async user => {
      if(user.id) {
        await deleteDataUser(id);
        const result = {
          ...user
        };
        return jsonResponse(res, result);
      } else {
        return jsonError(res, errorBadRequest);
      }
    }).catch(() =>  {
      const error = {
        code: 400,
        message: `Data user does not exist!`
      };
      return jsonError(res, error);
    });
  } catch(error) {
    return jsonError(res, errorBadRequest);
  }
};

module.exports = {
  getAllUsers,
  getAllRoles,
  getUser,
  postUser,
  putUser,
  deleteUser
};
