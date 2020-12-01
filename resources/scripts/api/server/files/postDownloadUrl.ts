import http from '@/api/http';

export default (uuid: string, root: string, url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/files/writeUrl`, { root, url })
            .then(() => resolve())
            .catch(reject);
    });
};
