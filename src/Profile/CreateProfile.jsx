import AddEditProfile from './AddEditProfile';

const CreateProfile = (props) => {
    return (
        <>
            <div className='cmmn-skeleton mt-2'>
                <section className="triangle mb-3"><h4 id="list-item-1" className="pl-2">Create Profile</h4></section>
                <AddEditProfile appsConfig={props.appsConfig} data={{
                    type: 'CREATE'
                }}
                    handlers={{

                    }}
                />
            </div>
        </>
    )
}

export default CreateProfile;
