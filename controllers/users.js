const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((user) => res.send({ data: user }))
    .catch((err) => res.status(500).send({ message: `Произошла ошибка ${err}` }));
};

module.exports.getUserById = (req, res) => {
  User.findById(req.params.userId)
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        return res
          .status(404)
          .send({ message: 'Пользователь по указанному _id не найден' });
      }
      if (err.name === 'CastError') {
        return res.status(400).send({
          message: 'Передан некорректный _id',
        });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};

module.exports.createUser = (req, res) => {
  const { password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({ email: req.body.email, password: hash }))
    .then((user) => res.status(201).send({ data: user }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(400).send({
          message: 'Переданы некорректные данные при создании пользователя',
        });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'secret-slovo', { expiresIn: '7d' });
      return res.send({ token });
    })
    .catch((err) => {
      res.status(401).send({ message: err.message });
    });
};

module.exports.getCurrentUser = (req, res, next) => {
  const { _id } = req.user;
  return User.findOne({ _id })
    .then((user) => {
      if (!user) {
        throw new Error('Нет пользователя с таким id');
      }
      res.status(200).send({ data: user });
    })
    .catch(next);
};

module.exports.updateProfile = (req, res) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        return res.status(404).send({
          message: 'Пользователь с указанным _id не найден',
        });
      }
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        return res.status(400).send({
          message: 'Переданы некорректные данные при обновлении профиля',
        });
      }
      return res.status(500).send({
        message: `Произошла ошибка ${err}`,
      });
    });
};

module.exports.updateAvatar = (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.body.avatar },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        return res.status(404).send({
          message: 'Пользователь с указанным _id не найден',
        });
      }
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        res.status(400).send({
          message: 'Переданы некорректные данные при обновлении аватара',
        });
      }
      return res.status(500).send({
        message: `Произошла ошибка ${err}`,
      });
    });
};
