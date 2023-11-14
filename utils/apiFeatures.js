class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObject = { ...this.queryStr };
    const excludedFields = ["page", "limit", "sort", "filter", "search"];
    excludedFields.forEach((field) => delete queryObject[field]);
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // TO show the newset rooms
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }
  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  pagination() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search() {
    if (this.queryStr.search) {
      // this.query = this.query.find({ name: { $in: this.queryStr.search } });
      console.log(this.queryStr.search);
      this.query = this.query.find({
        // $text: { $search: this.queryStr.search },
        name: { $regex: new RegExp(this.queryStr.search), $options: "i" },
      });
      console.log("Searching...");
    }
    return this;
  }
  searchByNumber() {
    if (this.queryStr.number) {
      this.query = this.query.find({
        // $text: { $search: this.queryStr.search },
        number: { $regex: new RegExp(this.queryStr.number), $options: "i" },
      });
      console.log("Searching by number...");
    }
    return this;
  }

  searchByRating() {
    if (this.queryStr.section) {
      console.log(this.queryStr.section);
      this.query = this.query.find({
        // $text: { $search: this.queryStr.search },
        section: { $eq: this.queryStr.section },
      });
    }
    console.log("Searching by section...");
    return this;
  }
}

module.exports = APIFeatures;
