import fs from 'fs';

const folderController = () => {
  const getDate = new Date();
  const year = getDate.getFullYear();

  const checkDir = (name) => {
    return new Promise((resolve, reject) => {
      fs.exists(name, (exists) => {
        resolve(exists);
      });
    });
  };

  const createDir = async () => {
    let dir = 'uploads';
    try {
      const check = await checkDir(dir);
      if (!check) {
        await fs.promises.mkdir(dir);
        dir = `${dir}/${year}`;
        await fs.promises.mkdir(dir);
      } else {
        dir = `${dir}/${year}`;
        await fs.promises.mkdir(dir);
      }
    } catch (err) {
      return dir;
    }

    return dir;
  };

  return (async () => {
    try {
      return createDir();
    } catch (err) {
      console.log(err);
    }
  })();
};

export default folderController;
