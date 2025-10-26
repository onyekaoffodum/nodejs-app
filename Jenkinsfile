
pipeline {
    agent any

    triggers{
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    tools {
        nodejs 'Node-20.19.5' // Ensure this matches the name of the NodeJS installation in Jenkins
    }

    environment {
        REMOTE_HOST = '172.31.18.87' // Replace with your server's IP or hostname
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

    post {
        always {
            sendEmail(currentBuild.currentResult,"sandieji@rocketmail.com")
            sendSlack(currentBuild.currentResult,"#lic-app-team")  
            cleanWs()
        }    
    }
}

def sendEmail(String buildStatus,String recipient) {   
   def subject = "${buildStatus}: Job ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
   def body = """<html>
                 <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            background: #fff;
                            border-radius: 8px;
                            padding: 20px;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        }
                        .header {
                            background-color: ${buildStatus == 'SUCCESS' ? '#4CAF50' : '#F44336'};
                            color: white;
                            padding: 15px;
                            border-radius: 8px 8px 0 0;
                            text-align: center;
                            font-size: 20px;
                            font-weight: bold;
                        }
                        .content {
                            padding: 20px;
                            font-size: 14px;
                            color: #333;
                        }
                        .footer {
                            font-size: 12px;
                            color: #888;
                            text-align: center;
                            padding-top: 15px;
                            border-top: 1px solid #ddd;
                        }
                        a.button {
                            display: inline-block;
                            padding: 10px 16px;
                            background-color: ${buildStatus == 'SUCCESS' ? '#4CAF50' : '#F44336'};
                            color: white;
                            border-radius: 4px;
                            text-decoration: none;
                            margin-top: 15px;
                        }
                        a.button:hover {
                            background-color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">${env.JOB_NAME} – Build #${env.BUILD_NUMBER} ${buildStatus}</div>
                        <div class="content">
                            <p>Please review the console output for details:</p>
                            <p style="text-align:center;">
                                <a class="button" href="${env.BUILD_URL}console">View Console Output</a>
                            </p>
                        </div>
                        <div class="footer">
                            Jenkins CI • ${new Date().format("EEE, MMM d yyyy HH:mm:ss z")}
                        </div>
                    </div>
                </body>
                </html>
                """
    emailext (
        subject: subject,
        body: body,
        mimeType: 'text/html',
        to: recipient
    )   
}

def sendSlack(String buildStatus,String channel) {
    def color = buildStatus == 'SUCCESS' ? 'good' : (buildStatus == 'UNSTABLE' ? 'warning' : 'danger')
    def message = "*${buildStatus}*: Job `${env.JOB_NAME}` - Build #${env.BUILD_NUMBER} \n" +
                  "Details: ${env.BUILD_URL}console"
    slackSend(channel: channel, color: color, message: message)
}