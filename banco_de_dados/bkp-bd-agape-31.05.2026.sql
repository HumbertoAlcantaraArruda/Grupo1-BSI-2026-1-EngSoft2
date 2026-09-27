-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: mysql.humcode.com.br    Database: humcode
-- ------------------------------------------------------
-- Server version	11.4.9-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Caixa`
--

DROP TABLE IF EXISTS `Caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Caixa` (
  `idCaixa` int(11) NOT NULL AUTO_INCREMENT,
  `dataHoraAbertura` datetime NOT NULL,
  `valorInicial` float NOT NULL,
  `dataHoraFechamento` datetime DEFAULT NULL,
  `valorFinal` float NOT NULL DEFAULT 0,
  `idUsuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`idCaixa`),
  KEY `fk_caixa_usuario` (`idUsuario`),
  CONSTRAINT `fk_caixa_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Caixa`
--

LOCK TABLES `Caixa` WRITE;
/*!40000 ALTER TABLE `Caixa` DISABLE KEYS */;
INSERT INTO `Caixa` VALUES (1,'2024-09-01 08:00:00',200,'2024-09-01 18:00:00',1245.5,NULL),(2,'2024-09-15 08:00:00',200,'2024-09-15 18:00:00',987.3,NULL),(3,'2024-10-01 08:00:00',300,'2024-10-01 18:30:00',1856.75,NULL),(4,'2024-10-15 08:00:00',300,'2024-10-15 19:00:00',2134.2,NULL),(5,'2024-11-01 08:00:00',300,'2026-05-22 18:33:48',300,NULL),(6,'2026-05-22 18:21:05',45,'2026-05-22 18:33:48',45,61),(7,'2026-05-22 18:24:10',2,'2026-05-22 18:33:48',1,61),(8,'2026-05-22 18:30:42',2,'2026-05-22 18:35:53',1,61),(9,'2026-05-22 18:33:53',20,'2026-05-22 18:34:11',18,61),(10,'2026-05-22 18:36:04',100,'2026-05-22 18:36:20',80,61),(11,'2026-05-22 18:38:09',100,'2026-05-22 18:38:22',80,61),(12,'2026-05-22 18:40:29',100,'2026-05-22 18:40:40',80,61),(13,'2026-05-22 18:41:03',100,'2026-05-22 18:46:49',78,61),(14,'2026-05-22 18:47:00',100,'2026-05-22 18:50:38',80,61),(15,'2026-05-22 18:50:47',45,'2026-05-22 19:24:37',128,61),(16,'2026-05-22 19:28:27',100,'2026-05-22 19:35:40',0,61),(17,'2026-05-22 21:37:06',100,'2026-05-23 20:47:56',90,61),(18,'2026-05-22 21:41:31',50,NULL,1000,100),(19,'2026-05-23 20:48:10',100,'2026-05-25 13:17:29',80,61),(20,'2026-05-25 13:24:06',100,'2026-05-25 13:24:30',120,61),(21,'2026-05-25 13:36:43',100,'2026-05-25 13:36:58',118,61),(22,'2026-05-25 13:39:08',100,'2026-05-25 13:39:11',100,61),(23,'2026-05-25 13:48:53',100,'2026-05-25 13:49:08',90,61),(24,'2026-05-25 14:15:40',100,'2026-05-25 14:15:56',118,61),(25,'2026-05-25 14:17:03',100,'2026-05-25 14:27:31',100,61),(26,'2026-05-28 20:31:37',0,'2026-05-28 22:13:44',100,61),(27,'2026-05-28 22:13:54',100,'2026-05-28 22:14:38',100,61),(28,'2026-05-28 22:17:18',100,'2026-05-28 22:17:21',100,61),(29,'2026-05-28 22:18:01',100,'2026-05-28 22:19:17',150,61),(30,'2026-05-29 01:26:30',10,'2026-05-29 01:27:18',85,61),(31,'2026-05-29 01:41:31',1,'2026-05-29 01:49:55',581,61),(32,'2026-05-29 16:47:21',23,'2026-05-29 20:06:10',23,61),(33,'2026-05-29 20:12:35',100,'2026-05-29 20:13:03',70,61),(34,'2026-05-29 21:39:25',1,'2026-05-29 21:51:45',136,61),(35,'2026-05-29 21:52:05',10,'2026-05-29 21:52:48',8,61);
/*!40000 ALTER TABLE `Caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CategoriaEvento`
--

DROP TABLE IF EXISTS `CategoriaEvento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CategoriaEvento` (
  `idCatEvento` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idCatEvento`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CategoriaEvento`
--

LOCK TABLES `CategoriaEvento` WRITE;
/*!40000 ALTER TABLE `CategoriaEvento` DISABLE KEYS */;
INSERT INTO `CategoriaEvento` VALUES (26,'Missa',1),(27,'Grupo de Oração',1),(28,'Catequese',1),(29,'Batismo',1),(30,'Crisma',1),(31,'Primeira Eucaristia',1),(32,'Casamento',1),(33,'Adoração ao Santíssimo',1),(34,'Retiro Espiritual',1),(35,'Encontro de Casais',1),(36,'Encontro de Jovens',1),(37,'Via Sacra',1),(38,'Novena',1),(39,'Festa do Padroeiro',1),(40,'Campanha da Fraternidade',1),(41,'Formação Litúrgica',1),(42,'Ministério de Música',1),(43,'Assembleia Paroquial',1),(44,'Encontro de Servos',1),(45,'Procissão',1);
/*!40000 ALTER TABLE `CategoriaEvento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CategoriaProduto`
--

DROP TABLE IF EXISTS `CategoriaProduto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CategoriaProduto` (
  `idCatProd` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`idCatProd`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CategoriaProduto`
--

LOCK TABLES `CategoriaProduto` WRITE;
/*!40000 ALTER TABLE `CategoriaProduto` DISABLE KEYS */;
INSERT INTO `CategoriaProduto` VALUES (1,'Velas',1),(2,'Terços',1),(3,'Bíblias',1),(4,'Imagens',1),(5,'Livros',1),(6,'Mídias',1),(7,'Artigos Litúrgicos',1),(8,'Vestes Litúrgicas',1),(9,'Objetos de Devoção',1);
/*!40000 ALTER TABLE `CategoriaProduto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Colaborador`
--

DROP TABLE IF EXISTS `Colaborador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Colaborador` (
  `idUsuario` int(11) NOT NULL,
  `Evento_idEvento` int(11) DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  KEY `fk_colab_evento_idx` (`Evento_idEvento`),
  CONSTRAINT `fk_colab_evento` FOREIGN KEY (`Evento_idEvento`) REFERENCES `Evento` (`idEvento`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_colab_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Colaborador`
--

LOCK TABLES `Colaborador` WRITE;
/*!40000 ALTER TABLE `Colaborador` DISABLE KEYS */;
INSERT INTO `Colaborador` VALUES (100,NULL);
/*!40000 ALTER TABLE `Colaborador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Compra`
--

DROP TABLE IF EXISTS `Compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Compra` (
  `idCompra` int(11) NOT NULL AUTO_INCREMENT,
  `dataHora` datetime NOT NULL,
  `valorTotal` float NOT NULL,
  `idFornec` int(11) NOT NULL,
  `idUsuario` int(11) NOT NULL,
  `numNotaFiscal` varchar(44) DEFAULT NULL,
  `obs` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`idCompra`),
  KEY `idx_compra_fornecedor` (`idFornec`),
  KEY `idx_compra_usuario` (`idUsuario`),
  CONSTRAINT `fk_compra_fornecedor` FOREIGN KEY (`idFornec`) REFERENCES `Fornecedor` (`idFornec`) ON UPDATE CASCADE,
  CONSTRAINT `fk_compra_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Compra`
--

LOCK TABLES `Compra` WRITE;
/*!40000 ALTER TABLE `Compra` DISABLE KEYS */;
INSERT INTO `Compra` VALUES (11,'2026-05-22 19:51:28',75,3,61,NULL,NULL),(12,'2026-05-22 19:56:16',10,2,61,NULL,NULL),(13,'2026-05-28 21:40:04',4000,3,61,NULL,NULL),(14,'2026-05-29 13:43:54',140,2,61,NULL,NULL),(15,'2026-05-29 21:55:22',410,1,61,NULL,NULL);
/*!40000 ALTER TABLE `Compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ContasReceber`
--

DROP TABLE IF EXISTS `ContasReceber`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ContasReceber` (
  `idConta` int(11) NOT NULL AUTO_INCREMENT,
  `Venda_idVenda` int(11) NOT NULL,
  `Caixa_idCaixa` int(11) NOT NULL,
  `Colaborador_idUsuario` int(11) NOT NULL,
  `valor` float DEFAULT NULL,
  `dataPagamento` datetime DEFAULT NULL,
  `valorPago` float DEFAULT NULL,
  `dataVencimento` datetime DEFAULT NULL,
  PRIMARY KEY (`idConta`),
  KEY `fk_ContasReceber_Venda1_idx` (`Venda_idVenda`),
  KEY `fk_ContasReceber_Caixa1_idx` (`Caixa_idCaixa`),
  KEY `fk_ContasReceber_Colaborador1_idx` (`Colaborador_idUsuario`),
  CONSTRAINT `fk_ContasReceber_Caixa1` FOREIGN KEY (`Caixa_idCaixa`) REFERENCES `Caixa` (`idCaixa`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_ContasReceber_Colaborador1` FOREIGN KEY (`Colaborador_idUsuario`) REFERENCES `Colaborador` (`idUsuario`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_ContasReceber_Venda1` FOREIGN KEY (`Venda_idVenda`) REFERENCES `Venda` (`idVenda`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ContasReceber`
--

LOCK TABLES `ContasReceber` WRITE;
/*!40000 ALTER TABLE `ContasReceber` DISABLE KEYS */;
/*!40000 ALTER TABLE `ContasReceber` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Devolucao`
--

DROP TABLE IF EXISTS `Devolucao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Devolucao` (
  `idDevolucao` int(11) NOT NULL AUTO_INCREMENT,
  `idVenda` int(11) NOT NULL,
  `Paroquiano_idUsuario` int(11) NOT NULL,
  `dataHora` datetime NOT NULL,
  `valorTotal` float NOT NULL,
  `reincorporaEst` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idDevolucao`),
  KEY `idx_devolucao_venda` (`idVenda`),
  KEY `fk_Devolucao_Paroquiano1_idx` (`Paroquiano_idUsuario`),
  CONSTRAINT `fk_Devolucao_Paroquiano1` FOREIGN KEY (`Paroquiano_idUsuario`) REFERENCES `Paroquiano` (`idUsuario`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_devolucao_venda` FOREIGN KEY (`idVenda`) REFERENCES `Venda` (`idVenda`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Devolucao`
--

LOCK TABLES `Devolucao` WRITE;
/*!40000 ALTER TABLE `Devolucao` DISABLE KEYS */;
INSERT INTO `Devolucao` VALUES (3,36,95,'2026-05-29 01:48:16',240,1),(4,28,95,'2026-05-29 17:53:55',80,1),(5,30,96,'2026-05-29 18:01:07',45,0),(6,30,96,'2026-05-29 18:01:30',15,1),(7,38,95,'2026-05-29 21:41:45',125,1);
/*!40000 ALTER TABLE `Devolucao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Evento`
--

DROP TABLE IF EXISTS `Evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Evento` (
  `idEvento` int(11) NOT NULL AUTO_INCREMENT,
  `idUsuarioResponsavel` int(11) NOT NULL,
  `idCatEvento` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `dataInicio` datetime NOT NULL,
  `dataFim` datetime NOT NULL,
  `totVagas` int(11) NOT NULL,
  `vagasDisp` int(11) DEFAULT NULL,
  `idEventoStatus` int(11) DEFAULT 1,
  `dataEvento` datetime DEFAULT NULL,
  `dataAberturaListaEspera` datetime DEFAULT NULL,
  `valorInscricao` float DEFAULT NULL,
  `imagemEvento` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idEvento`),
  KEY `idx_evento_categoria` (`idCatEvento`),
  KEY `fk_Evento_Usuario1_idx` (`idUsuarioResponsavel`),
  CONSTRAINT `fk_Evento_Usuario1` FOREIGN KEY (`idUsuarioResponsavel`) REFERENCES `Usuario` (`idUsuario`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_evento_categoria` FOREIGN KEY (`idCatEvento`) REFERENCES `CategoriaEvento` (`idCatEvento`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Evento`
--

LOCK TABLES `Evento` WRITE;
/*!40000 ALTER TABLE `Evento` DISABLE KEYS */;
INSERT INTO `Evento` VALUES (1,61,26,'Missa de Domingo','2025-06-01 08:00:00','2025-06-01 10:00:00',100,100,1,'2025-06-01 00:00:00','2025-05-25 00:00:00',0,'evento_sem_imagem.png'),(2,61,27,'Catequese Infantil','2025-06-02 14:00:00','2025-06-02 16:00:00',30,30,1,'2025-06-02 00:00:00','2025-05-28 00:00:00',0,'evento_sem_imagem.png'),(3,61,28,'Grupo de Oração','2025-06-03 19:00:00','2025-06-03 21:00:00',50,50,1,'2025-06-03 00:00:00','2025-05-29 00:00:00',0,'evento_sem_imagem.png'),(4,61,29,'Retiro Espiritual','2025-06-10 08:00:00','2025-06-12 18:00:00',40,37,1,'2025-06-10 00:00:00','2025-06-01 00:00:00',50,'evento_sem_imagem.png'),(5,61,30,'Batismo','2025-06-15 09:00:00','2025-06-15 11:00:00',20,19,4,'2026-05-22 22:00:00','2025-06-08 00:00:00',0,'evento_sem_imagem.png'),(6,61,31,'Casamento Comunitário','2025-06-20 10:00:00','2025-06-20 12:00:00',10,10,1,'2025-06-20 00:00:00','2025-06-13 00:00:00',30,'evento_sem_imagem.png'),(7,61,32,'Exposição do Santíssimo','2025-06-21 15:00:00','2025-06-21 17:00:00',0,0,1,'2025-06-21 00:00:00','2025-06-14 00:00:00',0,'evento_sem_imagem.png'),(8,61,33,'Evento de Jovens','2025-06-25 18:00:00','2025-06-25 22:00:00',100,100,1,'2025-06-25 00:00:00','2025-06-18 00:00:00',10,'evento_sem_imagem.png'),(9,61,34,'Adoração Noturna','2025-06-28 22:00:00','2025-06-29 06:00:00',0,0,1,'2025-06-28 00:00:00','2025-06-21 00:00:00',0,'evento_sem_imagem.png'),(10,61,35,'Festa Paroquial','2025-07-01 08:00:00','2025-07-01 20:00:00',500,500,1,'2025-07-01 00:00:00','2025-06-24 00:00:00',0,'evento_sem_imagem.png'),(14,61,40,'Cassia Events','2026-05-10 10:00:00','2026-05-25 17:00:00',20,19,1,'2026-05-28 08:00:00',NULL,50,'captura_de_tela_2026-04-25_170231.png'),(15,100,44,'Apresentação Final AGAPE','2026-05-29 13:40:00','2026-05-29 13:45:00',5,3,1,'2026-05-29 19:00:00',NULL,NULL,NULL),(16,61,40,'Cassia event','2026-05-29 20:00:00','2026-06-10 20:00:00',2,0,1,'2026-06-13 21:00:00','2026-05-29 21:50:14',NULL,NULL);
/*!40000 ALTER TABLE `Evento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EventoStatus`
--

DROP TABLE IF EXISTS `EventoStatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EventoStatus` (
  `idEventoStatus` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idEventoStatus`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EventoStatus`
--

LOCK TABLES `EventoStatus` WRITE;
/*!40000 ALTER TABLE `EventoStatus` DISABLE KEYS */;
INSERT INTO `EventoStatus` VALUES (1,'Ativo',1),(2,'Cancelado',1),(3,'Adiado',1),(4,'Finalizado',1);
/*!40000 ALTER TABLE `EventoStatus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FormaPagamento`
--

DROP TABLE IF EXISTS `FormaPagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FormaPagamento` (
  `idFormaPag` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `permiteParcelar` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`idFormaPag`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FormaPagamento`
--

LOCK TABLES `FormaPagamento` WRITE;
/*!40000 ALTER TABLE `FormaPagamento` DISABLE KEYS */;
INSERT INTO `FormaPagamento` VALUES (10,'Dinheiro',1,0),(11,'Cartão de Crédito',1,0),(12,'Cartão de Débito',1,0),(13,'Boleto',1,0),(14,'PIX',1,0),(15,'Cheque',1,0),(16,'Transferência Bancária',1,0),(17,'Vale Refeição',1,0),(18,'Vale Alimentação',1,0),(19,'Escambo',1,1);
/*!40000 ALTER TABLE `FormaPagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Fornecedor`
--

DROP TABLE IF EXISTS `Fornecedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Fornecedor` (
  `idFornec` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `telefone1` varchar(45) DEFAULT NULL,
  `telefone2` varchar(45) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `site` varchar(100) DEFAULT NULL,
  `contato` varchar(100) DEFAULT NULL,
  `cep` varchar(9) DEFAULT NULL,
  `logradouro` varchar(100) DEFAULT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `uf` varchar(2) DEFAULT NULL,
  `obs` varchar(400) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`idFornec`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Fornecedor`
--

LOCK TABLES `Fornecedor` WRITE;
/*!40000 ALTER TABLE `Fornecedor` DISABLE KEYS */;
INSERT INTO `Fornecedor` VALUES (1,'Casa do Sacrário Ltda','(11) 3456-7890','(11) 98765-4321','vendas@casadosacrario.com.br','www.casadosacrario.com.br','Sr. Marcos Antunes',NULL,NULL,NULL,NULL,NULL,NULL,1),(2,'Aparecida Artigos Religiosos','1132109876',NULL,'comercial@aparecidaart.com.br','www.aparecidaart.com.br','Sra. Helena Tavares',NULL,NULL,NULL,NULL,NULL,NULL,0),(3,'Editora Vozes','(24) 2233-9000','(24) 99887-6543','atendimento@vozes.com.br','www.vozes.com.br','Sr. Frei Bernardo',NULL,NULL,NULL,NULL,NULL,NULL,1),(4,'Velas Santa Luzia','(18) 3221-4567',NULL,'contato@velassantaluzia.com',NULL,'Sra. Aparecida Borges',NULL,NULL,NULL,NULL,NULL,NULL,1),(5,'Paulus Editora','(11) 5087-3700','(11) 95555-1212','vendas@paulus.com.br','www.paulus.com.br','Sr. Padre Eduardo',NULL,NULL,NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `Fornecedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Inscricao`
--

DROP TABLE IF EXISTS `Inscricao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Inscricao` (
  `idInscricao` int(11) NOT NULL AUTO_INCREMENT,
  `status` int(11) NOT NULL,
  `dataInscricao` datetime NOT NULL,
  `idUsuario` int(11) NOT NULL,
  `idEvento` int(11) NOT NULL,
  `obs` varchar(500) DEFAULT NULL,
  `dataObsStatus` datetime DEFAULT NULL,
  `pago` int(11) DEFAULT NULL,
  `tamCamiseta` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idInscricao`),
  KEY `idx_inscricao_usuario` (`idUsuario`),
  KEY `idx_inscricao_evento` (`idEvento`),
  CONSTRAINT `fk_inscricao_evento` FOREIGN KEY (`idEvento`) REFERENCES `Evento` (`idEvento`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inscricao_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Inscricao`
--

LOCK TABLES `Inscricao` WRITE;
/*!40000 ALTER TABLE `Inscricao` DISABLE KEYS */;
INSERT INTO `Inscricao` VALUES (43,1,'2026-05-22 20:54:20',99,4,NULL,NULL,NULL,NULL),(44,1,'2026-05-22 20:56:14',97,4,NULL,NULL,NULL,NULL),(45,1,'2026-05-22 20:56:43',96,4,NULL,NULL,NULL,NULL),(46,0,'2026-05-22 21:02:17',97,1,'Removido pelo administrador','2026-05-29 16:56:28',NULL,NULL),(47,1,'2026-05-22 21:03:31',95,5,NULL,NULL,NULL,NULL),(48,1,'2026-05-22 21:33:07',95,14,NULL,NULL,NULL,NULL),(49,0,'2026-05-22 21:36:12',97,14,'Cancelado pelo paroquiano','2026-05-22 21:34:01',NULL,NULL),(50,0,'2026-05-22 21:36:19',97,14,'Removido pelo administrador','2026-05-22 21:34:50',NULL,NULL),(51,1,'2026-05-29 13:40:34',95,15,NULL,NULL,NULL,NULL),(52,1,'2026-05-29 13:41:40',94,15,NULL,NULL,NULL,NULL),(53,1,'2026-05-29 21:47:18',95,16,NULL,NULL,NULL,NULL),(54,0,'2026-05-29 21:48:16',96,16,'Removido pelo administrador','2026-05-29 21:48:33',NULL,NULL),(55,1,'2026-05-29 21:50:14',96,16,NULL,NULL,NULL,NULL),(56,2,'2026-05-29 21:50:40',97,16,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `Inscricao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InscricaoListaEspera`
--

DROP TABLE IF EXISTS `InscricaoListaEspera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `InscricaoListaEspera` (
  `Inscricao_idInscricao` int(11) NOT NULL,
  `ordemEntrada` int(11) NOT NULL,
  `status` int(11) DEFAULT NULL,
  `dataStatus` datetime DEFAULT NULL,
  PRIMARY KEY (`Inscricao_idInscricao`,`ordemEntrada`),
  CONSTRAINT `fk_InscricaoListaEspera_Inscricao` FOREIGN KEY (`Inscricao_idInscricao`) REFERENCES `Inscricao` (`idInscricao`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InscricaoListaEspera`
--

LOCK TABLES `InscricaoListaEspera` WRITE;
/*!40000 ALTER TABLE `InscricaoListaEspera` DISABLE KEYS */;
INSERT INTO `InscricaoListaEspera` VALUES (56,1,NULL,NULL);
/*!40000 ALTER TABLE `InscricaoListaEspera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MovimentacaoCaixa`
--

DROP TABLE IF EXISTS `MovimentacaoCaixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MovimentacaoCaixa` (
  `idMov` int(11) NOT NULL AUTO_INCREMENT,
  `idCaixa` int(11) NOT NULL,
  `Usuario_idUsuario` int(11) NOT NULL,
  `dataHora` datetime NOT NULL,
  `valor` float NOT NULL,
  `motivo` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`idMov`),
  KEY `idx_mov_caixa` (`idCaixa`),
  KEY `fk_MovimentacaoCaixa_Usuario1_idx` (`Usuario_idUsuario`),
  CONSTRAINT `fk_MovimentacaoCaixa_Usuario1` FOREIGN KEY (`Usuario_idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_mov_caixa` FOREIGN KEY (`idCaixa`) REFERENCES `Caixa` (`idCaixa`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MovimentacaoCaixa`
--

LOCK TABLES `MovimentacaoCaixa` WRITE;
/*!40000 ALTER TABLE `MovimentacaoCaixa` DISABLE KEYS */;
INSERT INTO `MovimentacaoCaixa` VALUES (12,7,61,'2026-05-22 18:24:23',-1,'[SANGRIA] bala'),(14,8,61,'2026-05-22 18:30:53',-1,'[SANGRIA] bala'),(15,9,61,'2026-05-22 18:34:04',-2,'[SANGRIA] bala'),(16,8,61,'2026-05-22 18:34:52',-1,'[SANGRIA] teste'),(17,10,61,'2026-05-22 18:36:14',-20,'[SANGRIA] bala'),(18,11,61,'2026-05-22 18:38:18',-20,'[SANGRIA] bala'),(19,12,61,'2026-05-22 18:40:37',-20,'[SANGRIA] bala'),(20,13,61,'2026-05-22 18:41:48',-2,'[SANGRIA] bala'),(21,13,61,'2026-05-22 18:42:20',-20,'[SANGRIA] para custos'),(22,14,61,'2026-05-22 18:47:11',-20,'[SANGRIA] bala'),(23,15,61,'2026-05-22 18:50:54',-2,'[SANGRIA] bala'),(24,15,61,'2026-05-22 19:22:13',85,'Venda #28 | Forma: 10 | À vista'),(25,16,61,'2026-05-22 19:28:48',20,'[REFORCO] para custos'),(26,16,61,'2026-05-22 19:34:32',-120,'[SANGRIA] bala'),(27,17,61,'2026-05-22 21:37:56',20,'[REFORCO] para custos'),(28,17,61,'2026-05-22 21:38:23',-30,'[SANGRIA] para custos'),(29,19,61,'2026-05-25 13:17:24',-20,'[SANGRIA] bala'),(30,20,61,'2026-05-25 13:24:25',20,'[REFORCO] bala'),(31,21,61,'2026-05-25 13:36:49',20,'[REFORCO] bala'),(32,21,61,'2026-05-25 13:36:55',-2,'[SANGRIA] bala'),(33,23,61,'2026-05-25 13:48:59',20,'[REFORCO] bala'),(34,23,61,'2026-05-25 13:49:05',-30,'[SANGRIA] para custos'),(35,24,61,'2026-05-25 14:15:46',20,'[REFORCO] para custos'),(36,24,61,'2026-05-25 14:15:52',-2,'[SANGRIA] bala'),(37,26,61,'2026-05-28 20:53:33',100,'[SUPRIMENTO] Golzin'),(38,27,61,'2026-05-28 22:14:05',30,'[SUPRIMENTO] bala'),(39,27,61,'2026-05-28 22:14:31',-30,'[SANGRIA] para custos'),(42,18,61,'2026-05-29 01:17:44',100,'Venda #34 | Forma: 13 | À vista'),(43,18,61,'2026-05-29 01:17:44',900,'Venda #34 | Forma: 14 | À vista'),(44,30,61,'2026-05-29 01:27:08',75,'Venda #35 | Forma: 12 | À vista'),(45,31,61,'2026-05-29 01:42:02',480,'Venda #36 | Forma: 10 | À vista'),(46,31,61,'2026-05-29 01:49:22',100,'Venda #37 | Forma: 14 | À vista'),(47,33,61,'2026-05-29 20:12:45',20,'[SUPRIMENTO] teste'),(48,33,61,'2026-05-29 20:12:59',-50,'[SANGRIA] bala'),(49,34,61,'2026-05-29 21:40:11',135,'Venda #38 | Forma: 10 | À vista'),(50,35,61,'2026-05-29 21:52:33',1,'[SUPRIMENTO] teste'),(51,35,61,'2026-05-29 21:52:44',-3,'[SANGRIA] aaaa');
/*!40000 ALTER TABLE `MovimentacaoCaixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Parametrizacao`
--

DROP TABLE IF EXISTS `Parametrizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Parametrizacao` (
  `cnpj` varchar(18) NOT NULL,
  `razaoSocial` varchar(100) NOT NULL,
  `nomeFantasia` varchar(100) NOT NULL,
  `logradouro` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `uf` varchar(2) DEFAULT NULL,
  `cep` varchar(9) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `telefone1` varchar(45) DEFAULT NULL,
  `telefone2` varchar(45) DEFAULT NULL,
  `site` varchar(100) DEFAULT NULL,
  `responsavel` varchar(100) DEFAULT NULL,
  `logotipoPequeno` varchar(255) DEFAULT NULL,
  `logotipoGrande` varchar(255) DEFAULT NULL,
  `inscricaoEstadual` varchar(15) DEFAULT NULL,
  `inscricaoMunicipal` varchar(15) DEFAULT NULL,
  `numEndereco` varchar(10) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `moedaPadrao` varchar(100) DEFAULT NULL,
  `fusoHorario` varchar(50) DEFAULT NULL,
  `obs` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Parametrizacao`
--

LOCK TABLES `Parametrizacao` WRITE;
/*!40000 ALTER TABLE `Parametrizacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `Parametrizacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Paroquiano`
--

DROP TABLE IF EXISTS `Paroquiano`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Paroquiano` (
  `idUsuario` int(11) NOT NULL,
  `saldoCredito` float NOT NULL DEFAULT 0,
  PRIMARY KEY (`idUsuario`),
  CONSTRAINT `fk_paroq_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Paroquiano`
--

LOCK TABLES `Paroquiano` WRITE;
/*!40000 ALTER TABLE `Paroquiano` DISABLE KEYS */;
INSERT INTO `Paroquiano` VALUES (95,395),(96,60),(97,0),(98,0),(99,0);
/*!40000 ALTER TABLE `Paroquiano` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Produto`
--

DROP TABLE IF EXISTS `Produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Produto` (
  `idProd` int(11) NOT NULL AUTO_INCREMENT,
  `idCatProd` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `valorUni` float NOT NULL,
  `qtdAtual` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`idProd`),
  KEY `idx_produto_categoria` (`idCatProd`),
  CONSTRAINT `fk_produto_categoria` FOREIGN KEY (`idCatProd`) REFERENCES `CategoriaProduto` (`idCatProd`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Produto`
--

LOCK TABLES `Produto` WRITE;
/*!40000 ALTER TABLE `Produto` DISABLE KEYS */;
INSERT INTO `Produto` VALUES (1,1,'Vela 10cm',5,17),(2,2,'Terço de Madeira',15,29),(4,4,'Imagem Sagrado Coração',45,15),(5,5,'Livro de Missa',25,33),(6,6,'CD Músicas Católicas',20,175),(7,4,'Cálice',120,8),(8,8,'Cátedra',300,5),(9,9,'Rosário',10,72);
/*!40000 ALTER TABLE `Produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuario`
--

DROP TABLE IF EXISTS `Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario` (
  `idUsuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(150) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `nivel` varchar(10) DEFAULT NULL,
  `dataAtivacao` datetime DEFAULT NULL,
  `dataDesativacao` datetime DEFAULT NULL,
  `primeiroAcesso` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `uk_usuario_cpf` (`cpf`),
  UNIQUE KEY `uk_usuario_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuario`
--

LOCK TABLES `Usuario` WRITE;
/*!40000 ALTER TABLE `Usuario` DISABLE KEYS */;
INSERT INTO `Usuario` VALUES (61,'Padre João Batista Rocha','11122233344','pe.joao@paroquia.com.br','310000:ARRa1TkzD6xtI+8BB22fNA==:I3fDxX1Je236ZzHn4LrFprGOzJdh6XRUDcTcTHNPSHA=',1,'ADM','2026-05-16 16:38:52',NULL,NULL),(94,'Roberlei','68731004040','roberlei@email.com','310000:DC03ITgzA2iZKapImxve7A==:YpnJMLs20anNK/Cr8r7N6F8eHjKtiFBl0VQsrrolloQ=',1,'PAROQ','2026-05-22 15:32:13',NULL,0),(95,'Nicoly Rampaso','01024606201','nicoly@gmail.com','310000:KOwRmc5Q1jGeoRgNONxtRA==:uHy9o8BLBgCYXEVwBptaVS+2v0NBf6BewvNBJCgz4Cw=',1,'PAROQ','2026-05-22 16:19:41',NULL,0),(96,'Maria Joana','20427313074','maria@teste.com','310000:gF1KecBk+4pDxjxKF333nQ==:fVwqKfQHIsJpGp/6/WM8G8vq4TYsyJPUziWzKr+F4oM=',1,'PAROQ','2026-05-22 20:52:33',NULL,1),(97,'Joao de Jesus','91118370040','joao@teste.com','310000:FRxHKdydSJqCl3v/DAcbkA==:2gawCzWIsg1dn2mh5AQUEcKkubC4YNBcwyPWwhUJvig=',1,'PAROQ','2026-05-22 20:52:56',NULL,0),(98,'Matheus da silva','56486614013','matheus@teste.com','310000:PN5XDGpEwpLx8S42ssr0Tg==:P7AVSINEqwHVGtpz1mXjzu/ycPhgL12OJRXgpyxEQKU=',1,'PAROQ','2026-05-22 20:53:32',NULL,1),(99,'Nicolas','33699720004','nicolas@teste.com','310000:Cq16PBo4y+vWyF7d7dBgVw==:3RAt5AxZhNvA/GecxuNMfCsXErx+n/xHBQsyqzONSvk=',1,'PAROQ','2026-05-22 20:53:54',NULL,1),(100,'Humberto','47991727009','humberto@teste.com','310000:KCbJysLLx7z3Lm+vJP7T1g==:4WSHIWDMw/yS6V1d5eRNtoU600Qs6XULiSAyROAdHuI=',1,'COLAB','2026-05-22 20:59:44',NULL,0);
/*!40000 ALTER TABLE `Usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Venda`
--

DROP TABLE IF EXISTS `Venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Venda` (
  `idVenda` int(11) NOT NULL AUTO_INCREMENT,
  `idColaborador` int(11) NOT NULL,
  `idUsuario` int(11) NOT NULL,
  `idFormaPag` int(11) NOT NULL,
  `dataHora` datetime NOT NULL,
  `totBruto` float NOT NULL,
  `credUtilizado` float NOT NULL DEFAULT 0,
  `valorFinal` float NOT NULL,
  PRIMARY KEY (`idVenda`),
  KEY `idx_venda_usuario` (`idUsuario`),
  KEY `idx_venda_colaborador` (`idColaborador`),
  KEY `idx_venda_formapag` (`idFormaPag`),
  CONSTRAINT `fk_venda_colaborador` FOREIGN KEY (`idColaborador`) REFERENCES `Usuario` (`idUsuario`) ON UPDATE CASCADE,
  CONSTRAINT `fk_venda_formapag` FOREIGN KEY (`idFormaPag`) REFERENCES `FormaPagamento` (`idFormaPag`) ON UPDATE CASCADE,
  CONSTRAINT `fk_venda_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Venda`
--

LOCK TABLES `Venda` WRITE;
/*!40000 ALTER TABLE `Venda` DISABLE KEYS */;
INSERT INTO `Venda` VALUES (28,61,95,10,'2026-05-22 19:22:13',85,0,85),(29,61,96,11,'2026-05-22 20:57:15',50,0,50),(30,61,96,15,'2026-05-22 20:58:03',60,0,60),(31,61,95,13,'2026-05-22 21:21:50',535,0,535),(34,61,95,13,'2026-05-29 01:17:43',1000,0,1000),(35,61,95,12,'2026-05-29 01:27:08',75,0,75),(36,61,95,10,'2026-05-29 01:42:02',480,0,480),(37,61,95,14,'2026-05-29 01:49:22',150,50,100),(38,61,95,10,'2026-05-29 21:40:10',135,0,135);
/*!40000 ALTER TABLE `Venda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemCompra`
--

DROP TABLE IF EXISTS `itemCompra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemCompra` (
  `idCompra` int(11) NOT NULL,
  `idProd` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valorUnitario` float NOT NULL,
  PRIMARY KEY (`idProd`,`idCompra`),
  KEY `fk_itemcompra_produto` (`idProd`),
  KEY `fk_itemcompra_compra` (`idCompra`),
  CONSTRAINT `fk_itemcompra_compra` FOREIGN KEY (`idCompra`) REFERENCES `Compra` (`idCompra`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_itemcompra_produto` FOREIGN KEY (`idProd`) REFERENCES `Produto` (`idProd`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemCompra`
--

LOCK TABLES `itemCompra` WRITE;
/*!40000 ALTER TABLE `itemCompra` DISABLE KEYS */;
INSERT INTO `itemCompra` VALUES (15,1,10,5),(11,2,2,15),(14,2,2,15),(11,4,1,45),(13,6,200,20),(15,7,3,120),(12,9,1,10),(14,9,11,10);
/*!40000 ALTER TABLE `itemCompra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemDevolucao`
--

DROP TABLE IF EXISTS `itemDevolucao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemDevolucao` (
  `idDev` int(11) NOT NULL,
  `idProd` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valorUnitario` float NOT NULL,
  PRIMARY KEY (`idDev`,`idProd`),
  KEY `fk_itemdev_produto` (`idProd`),
  CONSTRAINT `fk_itemdev_devolucao` FOREIGN KEY (`idDev`) REFERENCES `Devolucao` (`idDevolucao`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_itemdev_produto` FOREIGN KEY (`idProd`) REFERENCES `Produto` (`idProd`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemDevolucao`
--

LOCK TABLES `itemDevolucao` WRITE;
/*!40000 ALTER TABLE `itemDevolucao` DISABLE KEYS */;
INSERT INTO `itemDevolucao` VALUES (3,7,2,120),(4,6,4,20),(5,1,9,5),(6,1,3,5),(7,1,1,5),(7,7,1,120);
/*!40000 ALTER TABLE `itemDevolucao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemVenda`
--

DROP TABLE IF EXISTS `itemVenda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemVenda` (
  `idVenda` int(11) NOT NULL,
  `idProd` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valorUnitario` float NOT NULL,
  PRIMARY KEY (`idVenda`,`idProd`),
  KEY `fk_itemvenda_produto` (`idProd`),
  CONSTRAINT `fk_itemvenda_produto` FOREIGN KEY (`idProd`) REFERENCES `Produto` (`idProd`) ON UPDATE CASCADE,
  CONSTRAINT `fk_itemvenda_venda` FOREIGN KEY (`idVenda`) REFERENCES `Venda` (`idVenda`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemVenda`
--

LOCK TABLES `itemVenda` WRITE;
/*!40000 ALTER TABLE `itemVenda` DISABLE KEYS */;
INSERT INTO `itemVenda` VALUES (28,1,1,5),(28,6,4,20),(29,1,1,5),(29,4,1,45),(30,1,12,5),(31,2,5,15),(31,5,4,25),(31,7,3,120),(34,6,50,20),(35,5,3,25),(36,7,4,120),(37,1,30,5),(38,1,3,5),(38,7,1,120);
/*!40000 ALTER TABLE `itemVenda` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-31 11:17:16
