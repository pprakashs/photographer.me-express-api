import User from './../models/userModal';

const userController = {
  getUserPhoto: async (req, res, next) => {
    try {
      let { page, limit } = req.query;
      //creating pagination
      page = page * 1 || 1;
      limit = limit * 1 || 10;
      const skip = (page - 1) * limit;

      const user = await User.findOne(req.params)
        .select('name')
        .populate({
          path: 'photos',
          select: '-__v -createdDate',
          options: { sort: '-createdDate', skip, limit },
        });
      if (!user) {
        throw 'User does not exist';
      }
      res.status(200).json({
        status: 'success',
        result: user.photos.length,
        data: user,
      });
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },
};

export default userController;
