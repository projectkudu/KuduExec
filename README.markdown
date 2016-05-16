### Kudu Exec

Tool providing a way to execute commands on your Azure Website, in a way this is a simplified terminal experience for your Azure website.

#### Installing

First, install [Node](http://nodejs.org/) if you don't already have it. Then run:

    npm install kuduexec -g

(If you don't want node.js there is also a .NET version of KuduExec called [KuduExec.NET](https://github.com/projectkudu/KuduExec.NET))

#### Running

    kuduExec [URL for the kudu service with or without username / password]
    kuduExec https://myuser@mysite.scm.azurewebsites.net/
    kuduExec https://myuser@mysite.scm.azurewebsites.net/mysite.git

![Screenshot](screenshots/screenshot1.png)

This project is under the benevolent umbrella of the [.NET Foundation](http://www.dotnetfoundation.org/).
