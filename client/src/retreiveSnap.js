import {Buckets} from '@textile/hub'
import {Buffer} from 'buffer'

const keyInfo = {
    key: process.env.REACT_APP_KEY_TEXTILEBUCKETS,
    secret: process.env.REACT_APP_SECRET_TEXTILEBUCKETS
}

async function getBucketClient() {
    const buckets = await Buckets.withKeyInfo(keyInfo)
    return buckets;
}

async function getOrCreateBucket(buckets, bucketName) {
    const {root,} = await buckets.getOrCreate(bucketName)
    if (!root) throw new Error('bucket not created')
    const bucketKey = root.key
    return bucketKey;
}

export async function pushExampleFile() {
    const bucketsX = await getBucketClient();
    console.log(bucketsX);
    let bucketKeyX = await getOrCreateBucket(bucketsX, 'testbucket');
    console.log(bucketKeyX);
    const fileX = {
        path: '/index.html',
        content: new Uint8Array(Buffer.from('https://bafzbeibnbpxeejbzvkgb26ex4x6k336gwyr25kzldyxiwdlvalrmbwlpwq.textile.space/test.txt'))
    }
    console.log(fileX);
    const links = await bucketsX.pushPath(bucketKeyX, 'test.txt', fileX)//, { root })
    console.log(`https://hub.textile.io${links.path.path}`);
}

export const retreiveSnap = async (url, setLoadingState=null) => {
    console.log("retreiveSnap");
    const now = new Date().getTime();
    if (setLoadingState)
        setLoadingState('Downloading snapshot')
    //const nowStr = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear() + ' ' + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    return await fetch("http://api.scraperapi.com?api_key=" + process.env.REACT_APP_KEY_SCRAPERAPI + "&url=" + url)
        .then(response => response.blob())
        .then(async blob => {
            //const objectURL = URL.createObjectURL(blob);
            if (setLoadingState)
                setLoadingState('Preparing upload')
            console.log("getBucketClient");
            const buckets = await getBucketClient();
            console.log("getOrCreateBucket");
            let bucketKey = await getOrCreateBucket(buckets, 'testbucket');
            console.log("prepare File");
            let blobContent = await new Response(blob).arrayBuffer();
            const file = {
                path: '/index.html',
                content: blobContent
            }
            console.log("pushPath");
            if (setLoadingState)
                setLoadingState('Uploading snapshot')
            const links = await buckets.pushPath(bucketKey, '/index.html', file)
            console.log("Finished upload, download link:");
            const snapUrl = `https://hub.textile.io${links.path.path}`;
            console.log(snapUrl);
            const snap = {date: now, url: url, snapUrl: snapUrl}
            console.log(snap)
            if (setLoadingState)
                setLoadingState('')
            return snap
        });
}
