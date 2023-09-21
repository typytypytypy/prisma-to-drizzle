import fs from "fs";
// get the prisma schema from the file
const prismaSchema = fs.readFileSync("./prisma/schema.prisma", "utf8");
const modelObj = {};

const convertPrismaToDrizzle = () => {
  // split the schema into lines
  const schemaFields = prismaSchema.split(/\r?\n/);

  // fs delete schema.ts if it exists
  fs.unlink("./db/schema.ts", function (err) {
    if (err) return console.log(err);
  });

  //   go through each line, decide if it is a model or not
  //   if it is a model, then create a new model
  //   if it is a field, then create a new field
  //   if it is a relation, then create a new relation
  //   if it is a comment, then ignore it
  //   if it is a blank line, then ignore it
  //   if it is a enum, then create a new enum
  let modelName = null;

  schemaFields.forEach((line) => {
    // if the line starts with // then ignore it
    if (line.trim().startsWith("//")) {
      return;
    } else if (line.match(/model (.*?) {/)) {
      // if the line matches the pattern model <name> {
      // create a new model
      //console.log("model", line);
      const modResults = createModel(line);
      modelName = modResults[0];
      const modelTable = modResults[1];
      if (modelName) {
        modelObj[modelName] = {
          name: modelName,
          table: modelTable,
          fields: [],
          relations: [],
          indexes: [],
        };
      }
    } else if (line.indexOf("}") >= 0) {
      closeModel(modelName);
      modelName = null;
    } else if (line.indexOf("@relation") >= 0) {
      // create a new relation
      // console.log("relation", line);
      createRelation(line, modelName);
    } else if (line.indexOf("enum") >= 0) {
      // create a new enum
      //console.log("enum", line);
      // createEnum(line);
    } else if (line.indexOf("@@") >= 0) {
      // create a new idnex
      //console.log("enum", line);
      createIndex(line, modelName);
    } else {
      if (modelName) {
        createField(line, modelName);
      }
    }
  });
  // console.log("modelObj", modelObj);
  // get the keys from the modelObj

  const importLine = `import { boolean,datetime, index, text, int, mysqlEnum, mysqlTable, serial, uniqueIndex, varchar, decimal, unique } from "drizzle-orm/mysql-core";
  \nimport { relations, sql } from "drizzle-orm"; \n`;

  fs.writeFile("./db/schema.ts", importLine, function (err) {
    if (err) return console.log(err);
  });
  const modelKeys = Object.keys(modelObj);
  // loop through the keys
  modelKeys.forEach((key) => {
    // get the model
    const model = modelObj[key];
    // create the model line
    let modelLine =
      "export const " +
      model.name +
      " = mysqlTable('" +
      model.table +
      "', { \n";
    // loop through the fields
    model.fields.forEach((field) => {
      // if field does not end with , then add it
      if (!field.endsWith(",")) {
        field += ",";
      }
      modelLine += field + "\n";
    });
    modelLine += "}, (t) => { return { \n";
    // loop through the relations
    // loop through the indexes
    model.indexes.forEach((index, idx) => {
      modelLine += `indx${idx}: ${index} ,\n`;
    });
    // close the model
    modelLine += "}}); \n";

    if (model.relations.length > 0) {
      modelLine +=
        "export const " +
        model.name +
        "Relations = relations(" +
        model.name +
        ",({one, many}) =>({ \n";
      model.relations.forEach((relation, idx) => {
        modelLine += relation + ",\n";
      });
      modelLine += "})); \n";
    }

    // model.relations.forEach((relation, idx) => {
    //   modelLine += relation;
    // });
    // write the model to a file
    fs.appendFile("./db/schema.ts", modelLine, function (err) {
      if (err) return console.log(err);
    });
  });
};

const createModel = (line: string) => {
  let model = line.replace("model", "").replace("{", "").trim();
  let snakeCase = toSnakeCase(model);
  let camelCase = toCamelCase(model);
  // let modelLine = "export const " + camelCase + " = mysqlTable('" + snakeCase + "', {";

  // console.log("snakeCase", snakeCase);
  // fs.writeFile("./db/schema/" + snakeCase + ".ts", modelLine, function (err) {
  //   if (err) return console.log(err);
  // });
  return [snakeCase, camelCase];
};

const closeModel = (modelName: string) => {
  if (modelName) {
    // fs.appendFile("./db/schema/" + modelName + ".ts", "});", function (err) {
    //   if (err) return console.log(err);
    // });
  }
};

const createField = (line: string, modelName: string) => {
  let field = line.trim().replace(/[ ,]+/g, ",");
  // if the field is empty, then ignore it
  if (field == "") {
    return;
  }
  const parts = field ? field.split(",") : null;
  const snakeCase = parts?.[0];
  const relation =
    parts?.[3] && parts?.[3] != null && parts?.[3] != undefined
      ? parts?.[3]
      : parts?.[2];
  const type = parts?.[1]
    ? convertType(parts[1], snakeCase, relation)
    : parts?.[1];
  const decorator = convertRelation(relation, parts?.[1], snakeCase);
  if (!type) {
    return createRelation(line, modelName);
  }
  const final = parts?.[0] + ": " + type + decorator;
  modelObj[modelName].fields.push(final);
  // fs.appendFile("./db/schema/" + modelName + ".ts", fieldLine, function (err) {
  //   if (err) return console.log(err);
  // });
};

const createRelation = (line: string, modelName: string) => {
  let field = line.trim().replace(/[ ,]+/g, ",");
  // if the field is empty, then ignore it
  if (field == "") {
    return;
  }
  const parts = field ? field.split(",") : null;
  const isMany = parts?.[1]?.indexOf("[]") >= 0;
  const relatedModel = parts?.[1]?.replace("?", "").replace("[]", "");
  const relatedModelSnake = toSnakeCase(relatedModel);
  // if the line contains @relation, then need to get anything inside @relation()
  const relationInfo = line.includes("@relation")
    ? line.match(/@relation\((.*?)\)/)
    : null;
  // split the relationInfo[1] by comma, then take anything before : as the key and anything after : as the value
  const relationInfoParts = relationInfo ? relationInfo[1].split(",") : null;
  const relationInfoObj = relationInfoParts
    ? relationInfoParts.reduce((acc, curr) => {
        const [key, value] = curr.split(":").map((item) => item.trim());
        if (key && value) {
          return { ...acc, [key]: value?.replace(/"/g, "") };
        } else if (key) {
          return { ...acc, name: key?.replace(/"/g, "") };
        }
        return acc;
      }, {})
    : null;
  if (relationInfoObj == null) {
    // if parts[1] has [] than it is a many relationship
    modelObj[modelName].relations.push(
      parts[0] +
        ": " +
        (isMany ? "many" : "one") +
        "(" +
        relatedModelSnake +
        ")"
    );
  } else {
    if (relationInfoObj?.fields) {
      // convert the fields into an array
      const fields = relationInfoObj?.fields
        ?.replace("[", "")
        .replace("]", "")
        .split(",");
      const references = relationInfoObj?.references
        ?.replace("[", "")
        .replace("]", "")
        .split(",");
      modelObj[modelName].relations.push(
        parts[0] +
          ": " +
          (isMany ? "many" : "one") +
          "(" +
          relatedModelSnake +
          ", { fields: [" +
          fields?.map((f) => `${modelName}.${f}`).join(",") +
          "], references: [" +
          references
            ?.map((f) => `${toSnakeCase(relatedModel)}.${f}`)
            .join(",") +
          "]})"
      );
    } else {
      modelObj[modelName].relations.push(
        parts[0] +
          ": " +
          (isMany ? "many" : "one") +
          "(" +
          relatedModelSnake +
          ")"
      );
    }
  }
  // if relationInfoObj is null
  // console.log("relation", relationInfo);
};

const createIndex = (line: string, modelName: string) => {
  // is this an index or a unique constraint?
  if (line.includes("@@unique")) {
    // unique constraint
    // create a new unique constraint
    // get the contents from inside the @@unique()
    const uniqueInfo = line.includes("@@unique")
      ? line.match(/@@unique\((.*?)\)/)
      : null;
    // split the uniqueInfo[1] by comma, then map each item, append table. to the beginning of each item    // get the text inside of the [] from uniqueInfo[1]
    const uFields = uniqueInfo[1] ? uniqueInfo[1].match(/\[(.*?)\]/) : null;
    const uniqueInfoParts = uFields[1]
      ? uFields[1].split(",").map((item) => "t" + "." + item.trim())
      : null;
    const constraint = `unique().on(${uniqueInfoParts?.join(",")})`;
    modelObj[modelName].indexes.push(constraint);
  } else {
    const indexInfo = line.includes("@@index")
      ? line.match(/@@index\((.*?)\)/)
      : null;
    if (!indexInfo) {
      return;
    }
    // split the uniqueInfo[1] by comma, then map each item, append table. to the beginning of each item    // get the text inside of the [] from uniqueInfo[1]
    const uFields = indexInfo[1] ? indexInfo[1].match(/\[(.*?)\]/) : null;
    const uniqueInfoParts = uFields[1]
      ? uFields[1].split(",").map((item) => "t" + "." + item.trim())
      : null;
    const constraint = `index('${uniqueInfoParts
      ?.join("_")
      .replace("t.", "")}').on(${uniqueInfoParts?.join(",")})`;
    modelObj[modelName].indexes.push(constraint);
  }
};

const toSnakeCase = (str: string) => {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, function (x, y) {
      return "_" + y.toLowerCase();
    })
    .replace(/^_/, "");
};

const toCamelCase = (str: string) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

const convertType = (
  type: string | null | undefined,
  snakecase: string | null | undefined,
  relation?: string | null
) => {
  if (type) {
    if (type.indexOf("Int?") >= 0) {
      return 'int("' + snakecase + '")';
    } else if (type.indexOf("Int") >= 0 && type.indexOf("Int?") < 0) {
      return 'int("' + snakecase + '").notNull()';
    } else if (type.indexOf("String") >= 0) {
      if (
        relation?.indexOf("@db.MediumText") >= 0 ||
        relation?.indexOf("@db.Text") >= 0
      ) {
        return 'text("' + snakecase + '")';
      }
      return 'varchar("' + snakecase + '", { length: 256 })';
    } else if (type.indexOf("Boolean") >= 0) {
      return 'int("' + snakecase + '")';
    } else if (type.indexOf("DateTime") >= 0) {
      // console.log("relation", relation);
      if (relation?.indexOf("@default(now())") >= 0) {
        return 'datetime("' + snakecase + '").notNull()';
      } else if (relation?.indexOf("@updatedAt") >= 0) {
        return (
          'datetime("' +
          snakecase +
          '").default(sql`current_timestamp(3) on update current_timestamp(3)`)'
        );
      }
      return 'datetime("' + snakecase + '")';
    } else if (type.indexOf("Float") >= 0) {
      return 'decimal("' + snakecase + '")';
    } else if (type.indexOf("Decimal") >= 0) {
      return 'decimal("' + snakecase + '")';
    }
    // else {
    //   const value = relation?.split("references: [")?.[1]?.replace("]", "");
    //   return "text('" + type?.toLowerCase()?.replace("?", "") + "_" + value + "')";
    // }
  } else {
    return null;
  }
};

const convertRelation = (
  relation: string | null | undefined,
  type?: string | null,
  snakeCase?: string | null
) => {
  if (!relation) {
    return ",";
  }

  if (
    relation.indexOf("@default") >= 0 &&
    relation.indexOf("autoincrement()") < 0 &&
    relation.indexOf("@default(now())") < 0 &&
    relation.indexOf("@default(cuid())") < 0
  ) {
    let value;

    if (type && type?.indexOf("Boolean") >= 0) {
      value = relation?.replace("@default(", "").replace(")", "");
      value = value == "true" ? "1" : "0";
    } else {
      value =
        relation.indexOf("@default('") >= 0
          ? relation?.replace("@default('", "").replace("')", "")
          : relation?.replace("@default(", "").replace(")", "");
    }

    return relation.indexOf("@default('") >= 0
      ? '.default("' + value + '"),'
      : ".default(" + value + "),";
  } else if (relation.indexOf("@default(now())") >= 0) {
    return ".default(sql`current_timestamp(3)`),";
  } else if (
    relation.indexOf("@default") >= 0 &&
    relation.indexOf("autoincrement()") >= 0
  ) {
    return ".primaryKey(),";
  } else if (relation.indexOf("references") >= 0 && type) {
    const value = relation?.split("references: [")?.[1]?.replace("]", "");
    return ".references(()=> " + snakeCase + "." + value + ",";
  } else {
    return "";
  }
};

convertPrismaToDrizzle();
