const Card = require('../models/card');

module.exports.getCards = (req, res) => {
  Card.find({})
    .then((cards) => {
      res.status(200).send({ data: cards });
    })
    .catch((err) => res.status(500).send({ message: `Произошла ошибка ${err}` }));
};

module.exports.createCard = (req, res) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => res.status(200).send({ data: card }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(400).send({
          message: 'Переданы некорректные данные при создании карточки',
        });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};

module.exports.deleteCard = (req, res) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (!card) {
        throw new Error('Такой карточки нет в Базе Данных');
      } if (!(Card.owner !== req.user._id)) {
        throw new Error('Нельзя удалить карточку другого пользователя');
      } else {
        Card.findByIdAndDelete(req.params.cardId).then(() => {
          res.status(200).send({ message: `Карточка ${card} удалена` });
        });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(400).send({
          message: 'Карточка с указанным _id не найдена',
        });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};

module.exports.likeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.send({ data: card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        return res.status(404).send({
          message: 'Нет карточки с таким id',
        });
      }
      if (err.name === 'CastError') {
        return res.status(400).send({
          message: 'Переданы некорректные данные для постановки лайка',
        });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};

module.exports.dislikeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.send({ data: card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        return res.status(404).send({ message: 'Нет карточки с таким id' });
      }
      if (err.name === 'CastError') {
        return res
          .status(400)
          .send({ message: 'Переданы некорректные данные при снятии лайка' });
      }
      return res.status(500).send({ message: `Произошла ошибка ${err}` });
    });
};
