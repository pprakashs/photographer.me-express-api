import multer from 'multer';
import folderController from './folderController';
import AppError from './../utils/appError';

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = await folderController();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    var [fName, ext] = file.originalname
      .split('.')
      .reduce((acc, val, i, arr) => (i == arr.length - 1 ? [acc[0].substring(1), val] : [[acc[0], val].join('.')]), []);
    cb(null, `${fName}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop();
  // matching the image format
  const extMatch = /(jpe?g|png)$/.test(ext);
  if (!extMatch) {
    cb(new AppError('Not an image! please upload only images', 400), false);
  } else if (!req.body.title) {
    cb(new AppError('Title must be required', 400), false);
  } else {
    cb(null, true);
  }
};

var upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const photoUploadController = upload.single('src');

export default photoUploadController;
