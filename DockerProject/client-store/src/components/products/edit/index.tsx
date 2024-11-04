import {useState, useEffect} from "react";
import {useNavigate, useParams, Link} from "react-router-dom";
import {http_common, API_URL} from '../../../env';
import {Button, Form, Modal, Input, Upload, UploadFile, Space, InputNumber, Select} from "antd";
import {RcFile, UploadChangeParam} from "antd/es/upload";
import {PlusOutlined} from '@ant-design/icons';
import {IProductEdit, IProductItem} from "../../../interfaces/products";
import {ICategoryName} from '../../../interfaces/categories';

const ProductEditPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm<IProductEdit>();
    const [removeFiles, setRemoveFiles] = useState<string[]>([]);
    const [files, setFiles] = useState<UploadFile[]>([]);

    const [previewOpen, setPreviewOpen] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [categories, setCategories] = useState<ICategoryName[]>([]);

    useEffect(() => {
        http_common.get<ICategoryName[]>("/api/Categories/names")
            .then(resp => {
                setCategories(resp.data);
            });
    }, []);

    useEffect(() => {
        http_common.get<IProductItem>(`/api/products/${id}`)
            .then(resp => {
                console.log("API Response: ", resp.data);
                const {data} = resp;
                form.setFieldsValue({
                    name: data.name,
                    categoryId: data.categoryId,
                    price: data.price,
                    id: data.id,
                });
                const newFileList: UploadFile[] = [];
                for (let i = 0; i < data.images.length; i++) {
                    newFileList.push({
                        uid: data.images[i],
                        name: data.images[i],
                        status: "done",
                        url: `${API_URL}/images/1200_${data.images[i]}`,
                    });
                }
                setFiles(newFileList);

            })
            .catch(error => {
                console.error("Error fetching product details:", error);
            });
    }, []);


    const onSubmit = async (values: IProductEdit) => {

        try {
            const updatedProduct : IProductEdit = {
                price: values.price,
                name: values.name,
                categoryId: values.categoryId,
                newImages: files
                    .filter(file=> file.originFileObj)
                    .map(file => file.originFileObj as RcFile),
                removeImages: removeFiles,
                id: Number(id),
            };

            console.log("Send model", updatedProduct);
            const resp = await http_common.put<IProductEdit>(`/api/products`,
                updatedProduct, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("Product updated: ", resp.data);
            navigate('/');
        } catch (error) {
            console.error("Error updating product: ", error);
        }
    };

    const categoriesData = categories.map(item => ({
        label: item.name,
        value: item.id
    }));

    const handleRemove = (file: UploadFile) => {
        if (file.name && !file.originFileObj) {
            setRemoveFiles(prev => [...prev, file.name]);
        }
        console.log("Remove file", file);
        return true;
    };

    //console.log("Categories", categories);
    return (
        <>
            <p className="text-center text-3xl font-bold mb-7">Edit Product</p>
            <Form form={form} onFinish={onSubmit} labelCol={{span: 6}} wrapperCol={{span: 14}}>
                <Form.Item name="name" label="Name" hasFeedback
                           rules={[{required: true, message: 'Please provide a valid category name.'}]}>
                    <Input placeholder='Type category name'/>
                </Form.Item>

                <Form.Item name="price" label="Price" hasFeedback
                           rules={[{required: true, message: 'Please enter product price.'}]}>
                    <InputNumber addonAfter="$" placeholder='0.00'/>
                </Form.Item>

                <Form.Item name="categoryId" label="Category" hasFeedback
                           htmlFor={"categoryId"}
                           rules={[{required: true, message: 'Please choose the category.'}]}>
                    <Select placeholder="Select a category" options={categoriesData}/>
                </Form.Item>

                <Form.Item name="images" label="Photo" valuePropName="Image"
                           rules={[{required: true, message: "Please choose a photo for the product."}]}
                           getValueFromEvent={(e: UploadChangeParam) => {
                               return e?.fileList.map(file => file.originFileObj);
                           }}>

                    <Upload
                        beforeUpload={() => false}
                        accept="image/*"
                        maxCount={10}
                        listType="picture-card" multiple
                        fileList={files}
                        onRemove={handleRemove}
                        onChange={(data) => {
                            setFiles(data.fileList);
                            //console.log("Updated files list: ", data.fileList);
                        }}
                        onPreview={(file: UploadFile) => {
                            if (!file.url && !file.preview) {
                                file.preview = URL.createObjectURL(file.originFileObj as RcFile);
                            }
                            setPreviewImage(file.url || (file.preview as string));
                            setPreviewOpen(true);
                            setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
                        }}>

                        <div>
                            <PlusOutlined/>
                            <div style={{marginTop: 8}}>Upload</div>
                        </div>
                    </Upload>
                </Form.Item>

                <Form.Item wrapperCol={{span: 10, offset: 10}}>
                    <Space>
                        <Link to={"/products"}>
                            <Button htmlType="button"
                                    className='text-white bg-gradient-to-br from-red-400 to-purple-600 font-medium rounded-lg px-5'>Cancel</Button>
                        </Link>
                        <Button htmlType="submit"
                                className='text-white bg-gradient-to-br from-green-400 to-blue-600 font-medium rounded-lg px-5'>Update</Button>
                    </Space>
                </Form.Item>
            </Form>

            <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)}>
                <img alt="example" style={{width: '100%'}} src={previewImage}/>
            </Modal>
        </>
    );
};

export default ProductEditPage;
