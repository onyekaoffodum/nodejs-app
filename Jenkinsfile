
pipeline {
    agent any

    tools {
        nodejs 'Node-20.19.5' // Ensure this matches the name of the NodeJS installation in Jenkins
    }

    environment {
        REMOTE_HOST = '172.31.31.169' // Replace with your server's IP or hostname
        REMOTE_USER = 'ec2-user'
        REMOTE_PATH = '/home/ec2-user/nodejs-app'
        SSH_CREDENTIALS = 'NodeServerSSHKey'
    }

    stages {
       
        /* 
           Stage to install dependencies to ensure the project is ready for deployment
           It uses npm to install the dependencies defined in package.json. 
           This is a crucial step to avoid runtime errors due to missing packages.
           It is executed on the Jenkins agent where the pipeline is running.   
        */
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Transfer to Remote Server') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no  $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH || true"
                        rsync -avz --exclude=node_modules --exclude=.git ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
                    '''
                }
            }
        }

        stage('Install & Deploy using Local PM2') {
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh '''
                        ssh $REMOTE_USER@$REMOTE_HOST "
                            cd $REMOTE_PATH &&
                            npm install &&
                            npx pm2 start app.js --name my-app --update-env || npx pm2 restart my-app
                        "
                    '''
                }
            }
        }
    }
}