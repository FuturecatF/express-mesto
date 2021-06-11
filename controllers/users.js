const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const CastError = require('../errors/CastError');
const DublicateError = require('../errors/DublicateError');
const UnauthorizedError = require('../errors/UnauthorizedError');

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(new NotFoundError('Нет пользователя с таким _id'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new CastError('Передан некорректный _id');
      }
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const { password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({ email: req.body.email, password: hash }))
    .then((user) => res.status(201).send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new ValidationError('Переданы некорректные данные при создании пользователя');
      }
      if (err.name === 'MongoError' && err.code === 11000) {
        throw new DublicateError('Пользователь с таким email уже существует');
      }
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'secret-slovo', { expiresIn: '7d' });
      return res.send({ token });
    })
    .catch(() => {
      throw new UnauthorizedError('передан неверный JWT token');
    })
    .catch(next);
};

module.exports.getCurrentUser = (req, res, next) => {
  const { _id } = req.user;
  return User.findOne({ _id })
    .orFail(new NotFoundError('Нет пользователя с таким _id'))
    .then((user) => {
      res.status(200).send({ data: user });
    })
    .catch(next);
};

module.exports.updateProfile = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(new NotFoundError('Пользователь с указанным _id не найден'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new CastError('Переданы некорректные данные при обновлении профиля');
      }
      if (err.name === 'ValidationError') {
        throw new ValidationError('Переданы некорректные данные при обновлении профиля');
      }
    })
    .catch(next);
};

module.exports.updateAvatar = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.body.avatar },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(new NotFoundError('Пользователь с указанным _id не найден'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new CastError('Переданы некорректные данные при обновлении аватара');
      }
      if (err.name === 'ValidationError') {
        throw new ValidationError('Переданы некорректные данные при обновлении аватара');
      }
    })
    .catch(next);
};
