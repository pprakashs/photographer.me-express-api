import Photo from './../models/photoModal';
import User from './../models/userModal';

const photoController = {
  createPhoto: async (req, res, next) => {
    try {
      if (req.file !== undefined) {
        req.body.src = req.file.filename;
        req.body.imgPath = req.file.destination;
      } else {
        req.body.src = '';
      }

      const newPhoto = await Photo.create(req.body);

      //saving the user on photo
      newPhoto.user = req.user;
      await newPhoto.save({ validateBeforeSave: false, select: '-passwordResetToken' });

      newPhoto.user = undefined;

      res.status(201).json({
        status: 'success',
        data: newPhoto,
      });
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },
};

export default photoController;
