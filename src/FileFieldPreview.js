import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex } from 'antd';
import style from './style.module.scss';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i;

const toFileList = value => {
  if (value == null || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const isHttpLike = value => typeof value === 'string' && /^(https?:|blob:|data:)/i.test(value);

const pickFilePreviewProps = file => {
  if (file == null || file === '') {
    return null;
  }
  if (typeof file === 'string') {
    const filename = file.split('/').pop() || file;
    if (isHttpLike(file)) {
      return { src: file, filename, originName: filename };
    }
    return { filename, originName: filename };
  }
  if (typeof file !== 'object') {
    return null;
  }
  const filename = file.filename || file.name || file.originName || file.originFileObj?.name;
  const src = file.src || file.url || file.path || file.thumbUrl;
  const id = file.id || file.uuid || file.fileId;
  if (!src && !id && !filename) {
    return null;
  }
  return {
    ...(src ? { src } : {}),
    ...(id ? { id } : {}),
    filename,
    originName: file.originName || filename,
    mimetype: file.mimetype || file.type || file.originFileObj?.type
  };
};

const isImageFile = (item, field) => {
  const type = field?.type;
  if (type === 'Avatar' || type === 'Signature') {
    return true;
  }
  const mime = item?.mimetype;
  if (typeof mime === 'string' && mime.startsWith('image/')) {
    return true;
  }
  return IMAGE_EXT.test(String(item?.filename || item?.originName || item?.src || ''));
};

const FileFieldPreview = createWithRemoteLoader({
  modules: ['components-core:File@FileLink', 'components-core:Image']
})(({ remoteModules, value, field }) => {
  const [FileLink, Image] = remoteModules;
  const files = toFileList(value).map(pickFilePreviewProps).filter(Boolean);

  if (!files.length) {
    return null;
  }

  return (
    <Flex vertical gap={8} className={style['schema-content-file-list']}>
      {files.map((item, index) => {
        const key = item.id || item.src || item.filename || String(index);
        const filename = item.filename || item.originName || '';
        const canPreview = !!(item.id || item.src);
        const asImage = isImageFile(item, field);

        if (!canPreview) {
          return (
            <span key={key} className={style['schema-content-file-name']}>
              {filename}
            </span>
          );
        }

        const linkProps = {
          id: item.id,
          src: item.src,
          url: item.src,
          filename,
          originName: item.originName || filename
        };

        if (asImage) {
          const preview = field?.type === 'Avatar' ? <Image.Avatar id={item.id} src={item.src} size={64} shape="square" alt={filename} /> : <Image id={item.id} src={item.src} alt={filename} className={style['schema-content-file-image']} />;
          return (
            <FileLink key={key} className={style['schema-content-file']} icon={null} {...linkProps}>
              {preview}
            </FileLink>
          );
        }

        return (
          <FileLink key={key} className={style['schema-content-file']} {...linkProps}>
            {filename}
          </FileLink>
        );
      })}
    </Flex>
  );
});

export default FileFieldPreview;
